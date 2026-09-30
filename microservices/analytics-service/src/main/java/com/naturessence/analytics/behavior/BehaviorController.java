package com.naturessence.analytics.behavior;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.naturessence.analytics.ShopAccess;
import com.naturessence.analytics.ml.MlTrainingService;
import com.naturessence.shared.entity.Shop;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Merchant analytics on interaction patterns (backoffice page "Comportement & IA"). */
@RestController
@RequestMapping("/api/v1/analytics/behavior")
@RequiredArgsConstructor
public class BehaviorController {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final JdbcTemplate jdbc;
    private final ShopAccess shopAccess;
    private final MlTrainingService training;
    private final DemoDataService demoData;

    @GetMapping("/overview")
    public Map<String, Object> overview(@RequestParam String shop, @RequestParam(defaultValue = "30") int days) {
        long shopId = shopAccess.forAdmin(shop).getId();
        int window = Math.max(1, Math.min(days, 365));
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("days", window);

        // Sessions are the unit of the funnel: did this visit reach each step?
        Map<String, Object> funnel = jdbc.queryForMap(
            "WITH s AS (SELECT session_id, bool_or(event_type = 'VIEW_PRODUCT') AS viewed, bool_or(event_type = 'ADD_TO_CART') AS carted, "
                + "bool_or(event_type = 'BEGIN_CHECKOUT') AS checkout, bool_or(event_type = 'PURCHASE') AS bought "
                + "FROM user_events WHERE shop_id = ? AND created_at > now() - make_interval(days => ?) GROUP BY session_id) "
                + "SELECT count(*) AS sessions, count(*) FILTER (WHERE viewed) AS viewed, count(*) FILTER (WHERE carted) AS carted, "
                + "count(*) FILTER (WHERE checkout) AS checkout, count(*) FILTER (WHERE bought) AS bought FROM s",
            shopId, window);
        result.put("funnel", funnel);
        result.put("kpis", jdbc.queryForMap(
            "SELECT count(DISTINCT visitor_id) AS visitors, count(DISTINCT session_id) AS sessions, "
                + "count(*) FILTER (WHERE event_type = 'VIEW_PRODUCT') AS product_views, count(*) FILTER (WHERE event_type = 'SEARCH') AS searches, "
                + "count(*) FILTER (WHERE event_type = 'ADD_TO_CART') AS add_to_cart, count(*) FILTER (WHERE event_type = 'PURCHASE') AS purchases, "
                + "count(*) FILTER (WHERE event_type = 'RECOMMENDATION_CLICK') AS recommendation_clicks, count(*) AS events "
                + "FROM user_events WHERE shop_id = ? AND created_at > now() - make_interval(days => ?)", shopId, window));
        result.put("daily", jdbc.queryForList(
            "SELECT to_char(date_trunc('day', created_at AT TIME ZONE 'Africa/Tunis'), 'YYYY-MM-DD') AS day, "
                + "count(DISTINCT visitor_id) AS visitors, count(*) FILTER (WHERE event_type = 'VIEW_PRODUCT') AS views, "
                + "count(*) FILTER (WHERE event_type = 'ADD_TO_CART') AS carts, count(*) FILTER (WHERE event_type = 'PURCHASE') AS purchases "
                + "FROM user_events WHERE shop_id = ? AND created_at > now() - make_interval(days => ?) GROUP BY 1 ORDER BY 1",
            shopId, window));
        result.put("hours", jdbc.queryForList(
            "SELECT extract(hour FROM created_at AT TIME ZONE 'Africa/Tunis')::int AS hour, count(*) AS events "
                + "FROM user_events WHERE shop_id = ? AND created_at > now() - make_interval(days => ?) GROUP BY 1 ORDER BY 1",
            shopId, window));
        result.put("topProducts", jdbc.queryForList(
            "SELECT s.product_id AS \"productId\", p.nom AS name, sum(s.views) AS views, sum(s.clicks) AS clicks, "
                + "sum(s.add_to_cart) AS carts, sum(s.purchases) AS purchases FROM product_stats_daily s "
                + "JOIN products p ON p.id = s.product_id WHERE s.shop_id = ? AND s.day > current_date - ? "
                + "GROUP BY s.product_id, p.nom ORDER BY views DESC, carts DESC LIMIT 10", shopId, window));
        result.put("topSearches", jdbc.queryForList(
            "SELECT query, sum(searches) AS searches, sum(clicks) AS clicks, sum(zero_results) AS \"zeroResults\" FROM search_stats_daily "
                + "WHERE shop_id = ? AND day > current_date - ? GROUP BY query ORDER BY searches DESC LIMIT 10", shopId, window));
        result.put("zeroResultSearches", jdbc.queryForList(
            "SELECT query, sum(zero_results) AS searches FROM search_stats_daily WHERE shop_id = ? AND day > current_date - ? "
                + "GROUP BY query HAVING sum(zero_results) > 0 ORDER BY searches DESC LIMIT 10", shopId, window));
        result.put("segments", latestRun(shopId, "segmentation"));
        result.put("recommender", latestRun(shopId, "recommender"));
        return result;
    }

    /** Retrain now instead of waiting for the nightly job. */
    @PostMapping("/train")
    public ResponseEntity<Object> train(@RequestParam String shop) {
        Shop s = shopAccess.forAdmin(shop);
        try {
            return ResponseEntity.ok(training.trainShop(s.getId()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    /** Demo history (visitor ids prefixed "demo-") to present the ML features on a shop without traffic. */
    @PostMapping("/demo-data")
    public Map<String, Object> generateDemo(@RequestParam String shop, @RequestParam(defaultValue = "150") int visitors) {
        return demoData.generate(shopAccess.forAdmin(shop).getId(), Math.max(10, Math.min(visitors, 1000)));
    }

    @DeleteMapping("/demo-data")
    public Map<String, Object> purgeDemo(@RequestParam String shop) {
        return demoData.purge(shopAccess.forAdmin(shop).getId());
    }

    private Map<String, Object> latestRun(long shopId, String model) {
        List<Map<String, Object>> rows = jdbc.queryForList(
            "SELECT status, metrics::text AS metrics, trained_at AS \"trainedAt\" FROM ml_model_runs WHERE shop_id = ? AND model = ? "
                + "ORDER BY trained_at DESC LIMIT 1", shopId, model);
        if (rows.isEmpty()) return null;
        Map<String, Object> run = new LinkedHashMap<>(rows.get(0));
        try {
            run.put("metrics", MAPPER.readValue(String.valueOf(run.get("metrics")), Map.class));
        } catch (Exception ignored) {
            run.remove("metrics");
        }
        if ("segmentation".equals(model)) {
            run.put("sizes", jdbc.queryForList(
                "SELECT cluster, count(*) AS size FROM behavior_segments WHERE shop_id = ? GROUP BY cluster ORDER BY cluster", shopId));
        }
        return run;
    }
}
