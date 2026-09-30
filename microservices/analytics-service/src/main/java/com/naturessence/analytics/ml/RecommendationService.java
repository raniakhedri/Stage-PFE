package com.naturessence.analytics.ml;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Serves recommendations from the precomputed neighbour tables.
 * Every method degrades gracefully: trained model → recent popularity → newest products,
 * so a brand-new shop still shows something sensible.
 */
@Service
@RequiredArgsConstructor
public class RecommendationService {

    /** Same implicit-feedback weights as the Python model. */
    private static final Map<String, Double> WEIGHTS = Map.of(
        "VIEW_PRODUCT", 1.0, "CLICK_PRODUCT", 1.0, "RECOMMENDATION_CLICK", 1.0, "SEARCH_CLICK", 1.5,
        "WISHLIST_ADD", 3.0, "ADD_TO_CART", 4.0, "BEGIN_CHECKOUT", 4.0, "PURCHASE", 8.0);
    /** At serving time recent intent matters most: a visit a week ago counts half. */
    private static final double SERVING_HALF_LIFE_DAYS = 7.0;
    private static final String ACTIVE = "EXISTS (SELECT 1 FROM products p WHERE p.id = r.rec_product_id AND p.statut = 'actif')";

    private final JdbcTemplate jdbc;

    public record Item(long productId, double score) {}

    public record Result(String strategy, List<Item> items) {}

    public Result similar(long shopId, long productId, int limit) {
        List<Item> items = jdbc.query(
            "SELECT r.rec_product_id, r.score FROM product_recommendations r WHERE r.shop_id = ? AND r.kind = 'SIMILAR' "
                + "AND r.product_id = ? AND " + ACTIVE + " ORDER BY r.rank LIMIT ?",
            (rs, i) -> new Item(rs.getLong(1), rs.getDouble(2)), shopId, productId, limit);
        if (!items.isEmpty()) return new Result("hybrid", items);
        // Not trained yet: popular products of the same category.
        items = jdbc.query(
            "SELECT p.id, COALESCE(sum(s.views + 3 * s.add_to_cart + 8 * s.purchases), 0) AS score FROM products p "
                + "JOIN products ref ON ref.id = ? AND ref.category_id = p.category_id "
                + "LEFT JOIN product_stats_daily s ON s.product_id = p.id AND s.shop_id = p.shop_id AND s.day > current_date - 30 "
                + "WHERE p.shop_id = ? AND p.id <> ? AND p.statut = 'actif' GROUP BY p.id ORDER BY score DESC, p.id DESC LIMIT ?",
            (rs, i) -> new Item(rs.getLong(1), rs.getDouble(2)), productId, shopId, productId, limit);
        return new Result("category_popularity", items);
    }

    public Result boughtTogether(long shopId, Collection<Long> productIds, int limit) {
        if (productIds.isEmpty()) return new Result("empty", List.of());
        Set<Long> exclude = new HashSet<>(productIds);
        Map<Long, Double> scores = aggregate(shopId, "TOGETHER", weightsOf(productIds), exclude);
        String strategy = "association_rules";
        if (scores.isEmpty()) {
            scores = aggregate(shopId, "SIMILAR", weightsOf(productIds), exclude);
            strategy = "hybrid";
        }
        return new Result(strategy, top(scores, limit));
    }

    public Result forVisitor(long shopId, String visitorId, Long userId, int limit) {
        String who = userId != null ? "(visitor_id = ? OR user_id = ?)" : "visitor_id = ?";
        Object[] args = userId != null
            ? new Object[] { shopId, visitorId == null ? "" : visitorId, userId }
            : new Object[] { shopId, visitorId == null ? "" : visitorId };
        List<Map<String, Object>> history = jdbc.queryForList(
            "SELECT product_id, event_type, created_at FROM user_events WHERE shop_id = ? AND product_id IS NOT NULL AND "
                + who + " AND created_at > now() - interval '90 days' ORDER BY created_at DESC LIMIT 80", args);
        Map<Long, Double> weights = new HashMap<>();
        Set<Long> owned = new HashSet<>();
        Instant now = Instant.now();
        for (Map<String, Object> row : history) {
            long pid = ((Number) row.get("product_id")).longValue();
            String type = (String) row.get("event_type");
            double age = Duration.between(((Timestamp) row.get("created_at")).toInstant(), now).toHours() / 24.0;
            weights.merge(pid, WEIGHTS.getOrDefault(type, 0.0) * Math.pow(0.5, age / SERVING_HALF_LIFE_DAYS), Double::sum);
            if ("PURCHASE".equals(type) || "ADD_TO_CART".equals(type)) owned.add(pid);
        }
        if (!weights.isEmpty()) {
            Map<Long, Double> scores = aggregate(shopId, "SIMILAR", weights, owned);
            if (!scores.isEmpty()) return new Result("personalized", top(blendWithPopularity(shopId, scores, owned), limit));
        }
        return popular(shopId, limit, owned);
    }

    /**
     * (1 − α)·personal + α·popularity, both in [0, 1]. α is learnt per shop at training time
     * (on real data best-sellers carry a lot of signal: seasonal peaks, consumables).
     */
    private Map<Long, Double> blendWithPopularity(long shopId, Map<Long, Double> personal, Set<Long> exclude) {
        double alpha = latestAlpha(shopId);
        if (alpha <= 0) return personal;
        double max = personal.values().stream().mapToDouble(Double::doubleValue).max().orElse(1.0);
        Map<Long, Double> blended = new HashMap<>();
        personal.forEach((id, s) -> blended.put(id, (1 - alpha) * (max > 0 ? s / max : 0)));
        jdbc.query("SELECT r.rec_product_id, r.score FROM product_recommendations r WHERE r.shop_id = ? AND r.kind = 'POPULAR' AND "
                + ACTIVE + " ORDER BY r.rank LIMIT 200",
            rs -> {
                long id = rs.getLong(1);
                if (!exclude.contains(id)) blended.merge(id, alpha * rs.getDouble(2), Double::sum);
            }, shopId);
        return blended;
    }

    private double latestAlpha(long shopId) {
        List<Double> rows = jdbc.query(
            "SELECT (metrics->>'alpha')::float8 FROM ml_model_runs WHERE shop_id = ? AND model = 'recommender' AND status = 'OK' "
                + "ORDER BY trained_at DESC LIMIT 1", (rs, i) -> rs.getObject(1) == null ? 0.0 : rs.getDouble(1), shopId);
        return rows.isEmpty() ? 0.0 : Math.max(0, Math.min(1, rows.get(0)));
    }

    public Result popular(long shopId, int limit, Set<Long> exclude) {
        List<Item> items = jdbc.query(
            "SELECT r.rec_product_id, r.score FROM product_recommendations r WHERE r.shop_id = ? AND r.kind = 'POPULAR' AND "
                + ACTIVE + " ORDER BY r.rank LIMIT ?",
            (rs, i) -> new Item(rs.getLong(1), rs.getDouble(2)), shopId, limit + exclude.size());
        if (items.isEmpty()) {
            items = jdbc.query(
                "SELECT p.id, COALESCE(sum(s.views + 3 * s.add_to_cart + 8 * s.purchases), 0) AS score FROM products p "
                    + "LEFT JOIN product_stats_daily s ON s.product_id = p.id AND s.shop_id = p.shop_id AND s.day > current_date - 30 "
                    + "WHERE p.shop_id = ? AND p.statut = 'actif' GROUP BY p.id ORDER BY score DESC, p.id DESC LIMIT ?",
                (rs, i) -> new Item(rs.getLong(1), rs.getDouble(2)), shopId, limit + exclude.size());
        }
        return new Result("popular", items.stream().filter(i -> !exclude.contains(i.productId())).limit(limit).toList());
    }

    /** Item-based scoring: Σ weight(history item) × similarity(history item, candidate). */
    private Map<Long, Double> aggregate(long shopId, String kind, Map<Long, Double> weights, Set<Long> exclude) {
        if (weights.isEmpty()) return Map.of();
        String in = weights.keySet().stream().map(String::valueOf).collect(Collectors.joining(","));
        Map<Long, Double> scores = new HashMap<>();
        jdbc.query("SELECT r.product_id, r.rec_product_id, r.score FROM product_recommendations r WHERE r.shop_id = ? AND r.kind = ? "
                + "AND r.product_id IN (" + in + ") AND " + ACTIVE,
            rs -> {
                long target = rs.getLong(2);
                if (!exclude.contains(target)) {
                    scores.merge(target, weights.get(rs.getLong(1)) * rs.getDouble(3), Double::sum);
                }
            }, shopId, kind);
        return scores;
    }

    private static Map<Long, Double> weightsOf(Collection<Long> ids) {
        Map<Long, Double> map = new LinkedHashMap<>();
        ids.forEach(id -> map.put(id, 1.0));
        return map;
    }

    private static List<Item> top(Map<Long, Double> scores, int limit) {
        List<Item> items = new ArrayList<>();
        scores.entrySet().stream()
            .sorted(Map.Entry.<Long, Double>comparingByValue().reversed())
            .limit(limit)
            .forEach(e -> items.add(new Item(e.getKey(), Math.round(e.getValue() * 10000) / 10000.0)));
        return items;
    }
}
