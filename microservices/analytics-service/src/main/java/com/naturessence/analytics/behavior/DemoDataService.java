package com.naturessence.analytics.behavior;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Demo history for presentations and for trying the ML features on an empty shop.
 * Every generated visitor id starts with "demo-" so {@link #purge} removes exactly this data.
 */
@Service
@RequiredArgsConstructor
public class DemoDataService {

    public static final String PREFIX = "demo-";

    private final JdbcTemplate jdbc;

    private record Persona(String name, int minSessions, int maxSessions, int minViews, int maxViews,
                           double searchRate, double cartRate, double buyRate, int maxAgeDays) {}

    private static final List<Persona> PERSONAS = List.of(
        new Persona("fidele", 5, 10, 3, 7, 0.05, 0.35, 0.8, 60),
        new Persona("abandonniste", 2, 5, 4, 9, 0.05, 0.45, 0.05, 45),
        new Persona("explorateur", 3, 6, 8, 16, 0.05, 0.03, 0.3, 45),
        new Persona("chercheur", 2, 4, 2, 5, 0.5, 0.2, 0.5, 45),
        new Persona("dormant", 1, 2, 1, 3, 0.05, 0.05, 0.2, 60)
    );

    @Transactional
    public Map<String, Object> generate(long shopId, int visitors) {
        List<Map<String, Object>> products = jdbc.queryForList(
            "SELECT p.id, p.nom, COALESCE(p.category_id, 0) AS category, p.sale_price FROM products p WHERE p.shop_id = ? AND p.statut = 'actif'",
            shopId);
        if (products.size() < 3) throw new IllegalArgumentException("Il faut au moins 3 produits actifs pour générer des données.");
        Map<Object, List<Map<String, Object>>> byCategory = products.stream().collect(Collectors.groupingBy(p -> p.get("category")));
        List<Object> categories = new ArrayList<>(byCategory.keySet());
        Random rnd = new Random(shopId * 31 + visitors);
        Instant now = Instant.now();
        List<Object[]> rows = new ArrayList<>();

        for (int v = 0; v < visitors; v++) {
            Persona persona = PERSONAS.get(v % PERSONAS.size());
            String visitor = PREFIX + UUID.randomUUID();
            // Each visitor mostly likes one or two categories: that is the pattern the models should find.
            Object favourite = categories.get(rnd.nextInt(categories.size()));
            Object second = categories.get(rnd.nextInt(categories.size()));
            int sessions = persona.minSessions() + rnd.nextInt(persona.maxSessions() - persona.minSessions() + 1);
            Instant last = persona.name().equals("dormant")
                ? now.minus(30 + rnd.nextInt(30), ChronoUnit.DAYS)
                : now.minus(rnd.nextInt(10), ChronoUnit.DAYS).minus(rnd.nextInt(600), ChronoUnit.MINUTES);
            Instant t = last.minus(5 + rnd.nextInt(Math.max(1, persona.maxAgeDays() - 5)), ChronoUnit.DAYS);
            for (int s = 0; s < sessions; s++) {
                t = s == sessions - 1 ? last : t.plus((long) ((last.toEpochMilli() - t.toEpochMilli()) * (0.1 + rnd.nextDouble() * 0.4)), ChronoUnit.MILLIS);
                String session = PREFIX + UUID.randomUUID();
                List<Long> carted = new ArrayList<>();
                int views = persona.minViews() + rnd.nextInt(persona.maxViews() - persona.minViews() + 1);
                for (int i = 0; i < views; i++) {
                    t = t.plusSeconds(20 + rnd.nextInt(160));
                    Object category = rnd.nextDouble() < 0.7 ? favourite : rnd.nextDouble() < 0.6 ? second : categories.get(rnd.nextInt(categories.size()));
                    List<Map<String, Object>> pool = byCategory.get(category);
                    Map<String, Object> p = pool.get(rnd.nextInt(pool.size()));
                    long pid = ((Number) p.get("id")).longValue();
                    if (rnd.nextDouble() < persona.searchRate()) {
                        String name = String.valueOf(p.get("nom")).toLowerCase();
                        String query = name.split(" ")[0];
                        rows.add(row(shopId, visitor, session, "SEARCH", null, query, 3 + rnd.nextInt(8), t));
                        rows.add(row(shopId, visitor, session, "SEARCH_CLICK", pid, query, null, t.plusSeconds(5)));
                    } else {
                        rows.add(row(shopId, visitor, session, "CLICK_PRODUCT", pid, null, null, t));
                    }
                    rows.add(row(shopId, visitor, session, "VIEW_PRODUCT", pid, null, null, t.plusSeconds(2)));
                    if (rnd.nextDouble() < persona.cartRate()) {
                        rows.add(row(shopId, visitor, session, "ADD_TO_CART", pid, null, null, t.plusSeconds(30)));
                        carted.add(pid);
                        if (rnd.nextDouble() < 0.2) rows.add(row(shopId, visitor, session, "WISHLIST_ADD", pid, null, null, t.plusSeconds(35)));
                    }
                }
                if (rnd.nextDouble() < 0.08) {
                    rows.add(row(shopId, visitor, session, "SEARCH", null, "produit introuvable " + rnd.nextInt(3), 0, t.plusSeconds(40)));
                }
                if (!carted.isEmpty() && rnd.nextDouble() < persona.buyRate()) {
                    t = t.plusSeconds(120);
                    rows.add(row(shopId, visitor, session, "BEGIN_CHECKOUT", null, null, null, t));
                    for (Long pid : carted) rows.add(row(shopId, visitor, session, "PURCHASE", pid, null, null, t.plusSeconds(90)));
                }
            }
        }
        jdbc.batchUpdate("INSERT INTO user_events (shop_id, visitor_id, session_id, event_type, product_id, search_query, results_count, created_at) "
            + "VALUES (?,?,?,?,?,?,?,?)", rows);
        rebuildAggregates(shopId);
        return Map.of("visitors", visitors, "events", rows.size());
    }

    @Transactional
    public Map<String, Object> purge(long shopId) {
        int deleted = jdbc.update("DELETE FROM user_events WHERE shop_id = ? AND visitor_id LIKE 'demo-%'", shopId);
        jdbc.update("DELETE FROM behavior_segments WHERE shop_id = ? AND subject LIKE 'v:demo-%'", shopId);
        rebuildAggregates(shopId);
        return Map.of("deletedEvents", deleted);
    }

    /** Recomputes the daily aggregates of a shop from its raw events. */
    public void rebuildAggregates(long shopId) {
        jdbc.update("DELETE FROM product_stats_daily WHERE shop_id = ?", shopId);
        jdbc.update("DELETE FROM search_stats_daily WHERE shop_id = ?", shopId);
        jdbc.update(
            "INSERT INTO product_stats_daily (shop_id, product_id, day, views, clicks, add_to_cart, wishlist, purchases) "
                + "SELECT shop_id, product_id, (created_at AT TIME ZONE 'Africa/Tunis')::date, "
                + "count(*) FILTER (WHERE event_type = 'VIEW_PRODUCT'), "
                + "count(*) FILTER (WHERE event_type IN ('CLICK_PRODUCT','SEARCH_CLICK','RECOMMENDATION_CLICK')), "
                + "COALESCE(sum(COALESCE(quantity, 1)) FILTER (WHERE event_type = 'ADD_TO_CART'), 0), "
                + "count(*) FILTER (WHERE event_type = 'WISHLIST_ADD'), "
                + "COALESCE(sum(COALESCE(quantity, 1)) FILTER (WHERE event_type = 'PURCHASE'), 0) "
                + "FROM user_events WHERE shop_id = ? AND product_id IS NOT NULL GROUP BY 1, 2, 3", shopId);
        jdbc.update(
            "INSERT INTO search_stats_daily (shop_id, day, query, searches, zero_results, clicks) "
                + "SELECT shop_id, (created_at AT TIME ZONE 'Africa/Tunis')::date, search_query, "
                + "count(*) FILTER (WHERE event_type = 'SEARCH'), count(*) FILTER (WHERE event_type = 'SEARCH' AND results_count = 0), "
                + "count(*) FILTER (WHERE event_type = 'SEARCH_CLICK') "
                + "FROM user_events WHERE shop_id = ? AND search_query IS NOT NULL GROUP BY 1, 2, 3", shopId);
    }

    private static Object[] row(long shopId, String visitor, String session, String type, Long productId, String query,
                                Integer results, Instant at) {
        return new Object[] { shopId, visitor, session, type, productId, query, results, Timestamp.from(at) };
    }
}
