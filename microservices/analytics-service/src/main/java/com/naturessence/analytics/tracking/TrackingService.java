package com.naturessence.analytics.tracking;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.sql.Types;
import java.text.Normalizer;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/** Validates storefront events and writes them in one batch, updating the daily aggregates. */
@Service
@RequiredArgsConstructor
public class TrackingService {

    public static final Set<String> TYPES = Set.of(
        "PAGE_VIEW", "VIEW_CATEGORY", "VIEW_PRODUCT", "CLICK_PRODUCT", "SEARCH", "SEARCH_CLICK",
        "ADD_TO_CART", "REMOVE_FROM_CART", "WISHLIST_ADD", "BEGIN_CHECKOUT", "PURCHASE", "RECOMMENDATION_CLICK"
    );
    private static final int MAX_BATCH = 50;
    private static final int MAX_EVENTS_PER_MINUTE = 240;
    private static final ZoneId ZONE = ZoneId.of("Africa/Tunis");

    private final JdbcTemplate jdbc;
    private final Map<String, int[]> rate = new ConcurrentHashMap<>();

    public record Event(String type, Long productId, String categorySlug, String query, Integer resultsCount,
                        Integer quantity, Double price, String page, Long ts) {}

    public record Batch(String shop, String visitorId, String sessionId, List<Event> events) {}

    /** @return number of events stored */
    @Transactional
    public int ingest(long shopId, Long userId, Batch batch) {
        String visitor = cleanId(batch.visitorId());
        String session = cleanId(batch.sessionId());
        if (visitor == null || session == null || batch.events() == null) {
            throw new IllegalArgumentException("visitorId, sessionId et events sont obligatoires");
        }
        List<Event> events = batch.events().stream()
            .filter(e -> e != null && e.type() != null && TYPES.contains(e.type()))
            .limit(MAX_BATCH)
            .toList();
        if (events.isEmpty() || !allow(visitor, events.size())) {
            return 0;
        }

        Instant now = Instant.now();
        List<Object[]> rows = new ArrayList<>();
        Map<String, int[]> productAgg = new HashMap<>();
        Map<String, int[]> searchAgg = new HashMap<>();
        for (Event e : events) {
            // Client clocks are not trusted beyond a small window.
            Instant at = e.ts() == null ? now : Instant.ofEpochMilli(e.ts());
            if (Duration.between(at, now).abs().toMinutes() > 10) at = now;
            String query = normalizeQuery(e.query());
            rows.add(new Object[] {
                shopId, userId, visitor, session, e.type(), e.productId(), trim(e.categorySlug(), 160), query,
                e.resultsCount(), e.quantity(), e.price(), trim(e.page(), 300), Timestamp.from(at),
            });
            LocalDate day = at.atZone(ZONE).toLocalDate();
            if (e.productId() != null) {
                int[] c = productAgg.computeIfAbsent(e.productId() + "|" + day, k -> new int[5]);
                switch (e.type()) {
                    case "VIEW_PRODUCT" -> c[0]++;
                    case "CLICK_PRODUCT", "SEARCH_CLICK", "RECOMMENDATION_CLICK" -> c[1]++;
                    case "ADD_TO_CART" -> c[2] += Math.max(1, e.quantity() == null ? 1 : e.quantity());
                    case "WISHLIST_ADD" -> c[3]++;
                    case "PURCHASE" -> c[4] += Math.max(1, e.quantity() == null ? 1 : e.quantity());
                    default -> { }
                }
            }
            if (query != null && ("SEARCH".equals(e.type()) || "SEARCH_CLICK".equals(e.type()))) {
                int[] c = searchAgg.computeIfAbsent(query + "|" + day, k -> new int[3]);
                if ("SEARCH".equals(e.type())) {
                    c[0]++;
                    if (e.resultsCount() != null && e.resultsCount() == 0) c[1]++;
                } else {
                    c[2]++;
                }
            }
        }

        jdbc.batchUpdate(
            "INSERT INTO user_events (shop_id, user_id, visitor_id, session_id, event_type, product_id, category_slug, "
                + "search_query, results_count, quantity, price, page, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
            rows,
            new int[] { Types.BIGINT, Types.BIGINT, Types.VARCHAR, Types.VARCHAR, Types.VARCHAR, Types.BIGINT, Types.VARCHAR,
                Types.VARCHAR, Types.INTEGER, Types.INTEGER, Types.NUMERIC, Types.VARCHAR, Types.TIMESTAMP });

        List<Object[]> productRows = new ArrayList<>();
        productAgg.forEach((key, c) -> {
            String[] parts = key.split("\\|");
            productRows.add(new Object[] { shopId, Long.parseLong(parts[0]), java.sql.Date.valueOf(parts[1]), c[0], c[1], c[2], c[3], c[4] });
        });
        if (!productRows.isEmpty()) {
            jdbc.batchUpdate(
                "INSERT INTO product_stats_daily (shop_id, product_id, day, views, clicks, add_to_cart, wishlist, purchases) "
                    + "VALUES (?,?,?,?,?,?,?,?) ON CONFLICT (shop_id, day, product_id) DO UPDATE SET "
                    + "views = product_stats_daily.views + EXCLUDED.views, clicks = product_stats_daily.clicks + EXCLUDED.clicks, "
                    + "add_to_cart = product_stats_daily.add_to_cart + EXCLUDED.add_to_cart, "
                    + "wishlist = product_stats_daily.wishlist + EXCLUDED.wishlist, "
                    + "purchases = product_stats_daily.purchases + EXCLUDED.purchases",
                productRows);
        }
        List<Object[]> searchRows = new ArrayList<>();
        searchAgg.forEach((key, c) -> {
            int cut = key.lastIndexOf('|');
            searchRows.add(new Object[] { shopId, java.sql.Date.valueOf(key.substring(cut + 1)), key.substring(0, cut), c[0], c[1], c[2] });
        });
        if (!searchRows.isEmpty()) {
            jdbc.batchUpdate(
                "INSERT INTO search_stats_daily (shop_id, day, query, searches, zero_results, clicks) VALUES (?,?,?,?,?,?) "
                    + "ON CONFLICT (shop_id, day, query) DO UPDATE SET searches = search_stats_daily.searches + EXCLUDED.searches, "
                    + "zero_results = search_stats_daily.zero_results + EXCLUDED.zero_results, "
                    + "clicks = search_stats_daily.clicks + EXCLUDED.clicks",
                searchRows);
        }
        return rows.size();
    }

    /** Simple per-visitor limiter so one browser cannot flood the table. */
    private boolean allow(String visitor, int count) {
        long minute = System.currentTimeMillis() / 60_000;
        int[] slot = rate.compute(visitor, (k, v) -> v == null || v[0] != (int) minute ? new int[] { (int) minute, 0 } : v);
        synchronized (slot) {
            if (slot[1] + count > MAX_EVENTS_PER_MINUTE) return false;
            slot[1] += count;
        }
        if (rate.size() > 50_000) rate.clear();
        return true;
    }

    /** "  Robe LIN écrue " → "robe lin ecrue": one row per query in the search statistics. */
    static String normalizeQuery(String query) {
        if (query == null) return null;
        String q = Normalizer.normalize(query, Normalizer.Form.NFD).replaceAll("\\p{M}", "")
            .toLowerCase(Locale.ROOT).replaceAll("\\s+", " ").trim();
        return q.isEmpty() ? null : trim(q, 200);
    }

    private static String cleanId(String value) {
        return value != null && value.matches("[A-Za-z0-9-]{8,64}") ? value : null;
    }

    private static String trim(String value, int max) {
        if (value == null) return null;
        return value.length() > max ? value.substring(0, max) : value;
    }
}
