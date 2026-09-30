package com.naturessence.analytics.ml;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.naturessence.shared.entity.Shop;
import com.naturessence.shared.repository.ShopRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Trains, per shop, the hybrid recommender and the behavioural segmentation, then stores the
 * results in Postgres so serving is a plain indexed lookup (no Python at request time).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MlTrainingService {

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final int INTERACTION_DAYS = 180;
    private static final int SEGMENT_DAYS = 90;
    private static final String PAID = "o.status NOT IN ('ANNULEE', 'REMBOURSEE')";
    /** A logged-in customer and their anonymous visits are merged under the same subject key. */
    private static final String SUBJECT = "COALESCE('u:' || e.user_id, 'v:' || e.visitor_id)";

    private final JdbcTemplate jdbc;
    private final TransactionTemplate tx;
    private final PythonRunner python;
    private final ShopRepository shopRepository;

    /** Nightly retraining for every live shop. */
    @Scheduled(cron = "0 40 3 * * *")
    public void trainAll() {
        for (Shop shop : shopRepository.findAll()) {
            if (!Shop.ACTIVE.equals(Shop.statusOf(shop))) continue;
            try {
                trainShop(shop.getId());
            } catch (Exception e) {
                log.warn("ML training failed for shop {}: {}", shop.getSlug(), e.getMessage());
            }
        }
    }

    public Map<String, Object> trainShop(long shopId) throws Exception {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("recommender", trainRecommender(shopId));
        result.put("segmentation", trainSegmentation(shopId));
        return result;
    }

    public JsonNode trainRecommender(long shopId) throws Exception {
        List<Map<String, Object>> products = jdbc.queryForList(
            "SELECT p.id, p.nom AS name, p.description, c.nom AS category, p.sub_category AS \"subCategory\", p.tissu, "
                + "p.couleur, p.coupe, p.genre, p.saison, p.latin, p.origine FROM products p "
                + "LEFT JOIN categories c ON c.id = p.category_id WHERE p.shop_id = ? AND p.statut = 'actif'", shopId);
        if (products.size() < 2) {
            return record(shopId, "recommender", "SKIPPED", Map.of("reason", "moins de 2 produits actifs"));
        }

        List<Map<String, Object>> interactions = new ArrayList<>(jdbc.queryForList(
            "SELECT " + SUBJECT + " AS subject, e.product_id AS \"productId\", e.event_type AS type, e.created_at AS ts "
                + "FROM user_events e WHERE e.shop_id = ? AND e.product_id IS NOT NULL "
                + "AND e.created_at > now() - make_interval(days => ?) "
                + "AND e.event_type IN ('VIEW_PRODUCT','CLICK_PRODUCT','SEARCH_CLICK','WISHLIST_ADD','ADD_TO_CART','BEGIN_CHECKOUT','PURCHASE','RECOMMENDATION_CLICK')",
            shopId, INTERACTION_DAYS));
        interactions.forEach(row -> {
            if ("RECOMMENDATION_CLICK".equals(row.get("type"))) row.put("type", "CLICK_PRODUCT");
            row.put("ts", String.valueOf(row.get("ts")).replace(' ', 'T'));
        });
        // Orders are the ground truth for purchases, including orders placed before tracking existed.
        interactions.addAll(jdbc.queryForList(
            "SELECT COALESCE('u:' || o.user_id, 'e:' || lower(o.email)) AS subject, i.product_id AS \"productId\", "
                + "'PURCHASE' AS type, to_char(o.created_at, 'YYYY-MM-DD\"T\"HH24:MI:SS') AS ts "
                + "FROM order_items i JOIN orders o ON o.id = i.order_id WHERE o.shop_id = ? AND " + PAID
                + " AND i.product_id IS NOT NULL", shopId));

        // Baskets: products bought in the same tracked session, plus orders placed before tracking
        // started (later orders are already covered by their session, so nothing is counted twice).
        List<List<Long>> baskets = new ArrayList<>();
        jdbc.query("SELECT array_agg(DISTINCT product_id) AS items FROM user_events WHERE shop_id = ? AND event_type = 'PURCHASE' "
                + "AND product_id IS NOT NULL GROUP BY session_id HAVING count(DISTINCT product_id) > 1",
            rs -> { baskets.add(List.of((Long[]) rs.getArray("items").getArray())); }, shopId);
        jdbc.query("SELECT array_agg(DISTINCT i.product_id) AS items FROM order_items i JOIN orders o ON o.id = i.order_id "
                + "WHERE o.shop_id = ? AND " + PAID + " AND i.product_id IS NOT NULL AND o.created_at < COALESCE("
                + "(SELECT min(created_at) FROM user_events WHERE shop_id = ? AND event_type = 'PURCHASE'), 'infinity') "
                + "GROUP BY o.id HAVING count(DISTINCT i.product_id) > 1",
            rs -> { baskets.add(List.of((Long[]) rs.getArray("items").getArray())); }, shopId, shopId);

        Map<String, Object> input = new LinkedHashMap<>();
        input.put("products", products);
        input.put("interactions", interactions);
        input.put("baskets", baskets);
        JsonNode out = python.run("recommend", input);

        List<Object[]> rows = new ArrayList<>();
        addNeighbours(rows, shopId, "SIMILAR", out.path("similar"), 1);
        addNeighbours(rows, shopId, "TOGETHER", out.path("boughtTogether"), 1);
        // Popularity of each product in [0, 1], best first: fallback list and blending term for "for you".
        List<Map.Entry<String, JsonNode>> popularity = new ArrayList<>();
        out.path("popularity").fields().forEachRemaining(popularity::add);
        popularity.sort((a, b) -> Double.compare(b.getValue().asDouble(), a.getValue().asDouble()));
        int rank = 0;
        for (Map.Entry<String, JsonNode> e : popularity.subList(0, Math.min(popularity.size(), 5000))) {
            rows.add(new Object[] { shopId, "POPULAR", 0L, rank++, Long.parseLong(e.getKey()), (float) e.getValue().asDouble() });
        }
        tx.executeWithoutResult(status -> {
            jdbc.update("DELETE FROM product_recommendations WHERE shop_id = ?", shopId);
            jdbc.batchUpdate("INSERT INTO product_recommendations (shop_id, kind, product_id, rank, rec_product_id, score) "
                + "VALUES (?,?,?,?,?,?)", rows);
        });
        Map<String, Object> metrics = MAPPER.convertValue(out.path("stats"), Map.class);
        metrics.put("rows", rows.size());
        return record(shopId, "recommender", "OK", metrics);
    }

    public JsonNode trainSegmentation(long shopId) throws Exception {
        List<Map<String, Object>> events = new ArrayList<>(jdbc.queryForList(
            "SELECT " + SUBJECT + " AS subject, e.event_type AS type, e.created_at AS ts FROM user_events e "
                + "WHERE e.shop_id = ? AND e.created_at > now() - make_interval(days => ?)", shopId, SEGMENT_DAYS));
        events.forEach(row -> row.put("ts", String.valueOf(row.get("ts")).replace(' ', 'T')));
        JsonNode out = python.run("segment", Map.of("events", events));

        List<Object[]> rows = new ArrayList<>();
        for (JsonNode pair : out.path("subjects")) {
            rows.add(new Object[] { shopId, pair.get(0).asText(), pair.get(1).asInt() });
        }
        tx.executeWithoutResult(status -> {
            jdbc.update("DELETE FROM behavior_segments WHERE shop_id = ?", shopId);
            if (!rows.isEmpty()) {
                jdbc.batchUpdate("INSERT INTO behavior_segments (shop_id, subject, cluster) VALUES (?,?,?)", rows);
            }
        });
        Map<String, Object> metrics = new LinkedHashMap<>();
        metrics.put("metrics", MAPPER.convertValue(out.path("metrics"), Map.class));
        metrics.put("profiles", MAPPER.convertValue(out.path("profiles"), List.class));
        return record(shopId, "segmentation", rows.isEmpty() ? "SKIPPED" : "OK", metrics);
    }

    private static void addNeighbours(List<Object[]> rows, long shopId, String kind, JsonNode map, int scoreIndex) {
        map.fields().forEachRemaining(entry -> {
            long productId = Long.parseLong(entry.getKey());
            int rank = 0;
            for (JsonNode n : entry.getValue()) {
                rows.add(new Object[] { shopId, kind, productId, rank++, n.get(0).asLong(), (float) n.get(scoreIndex).asDouble() });
            }
        });
    }

    private JsonNode record(long shopId, String model, String status, Map<String, Object> metrics) throws Exception {
        String json = MAPPER.writeValueAsString(metrics);
        jdbc.update("INSERT INTO ml_model_runs (shop_id, model, status, metrics) VALUES (?,?,?,?::jsonb)", shopId, model, status, json);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("status", status);
        result.putAll(metrics);
        return MAPPER.valueToTree(result);
    }
}
