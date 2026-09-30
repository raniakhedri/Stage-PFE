package com.naturessence.analytics.tracking;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Storage for behavioural events, created by this service at start-up (ddl-auto is off here).
 *
 * <ul>
 *   <li>{@code user_events} is range-partitioned by month: queries on recent weeks only read
 *       recent partitions, and dropping a month of history is instant (no DELETE, no bloat).</li>
 *   <li>A BRIN index on {@code created_at} covers time scans for a few KB, because events are
 *       appended in time order; B-tree indexes serve the per-shop, per-session and per-product lookups.</li>
 *   <li>Daily aggregates ({@code product_stats_daily}, {@code search_stats_daily}) are updated on
 *       ingestion so dashboards never scan raw events.</li>
 *   <li>ML outputs (recommendations, segments, model runs) live in their own small tables.</li>
 * </ul>
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class EventStore implements ApplicationRunner {

    /** Raw events older than this are dropped; daily aggregates are kept. */
    static final int RETENTION_MONTHS = 13;

    private static final DateTimeFormatter SUFFIX = DateTimeFormatter.ofPattern("yyyy_MM");

    private final JdbcTemplate jdbc;

    @Override
    public void run(ApplicationArguments args) {
        createSchema();
        maintainPartitions();
    }

    void createSchema() {
        List<String> ddl = List.of(
            """
            CREATE TABLE IF NOT EXISTS user_events (
                id            BIGSERIAL,
                shop_id       BIGINT       NOT NULL,
                user_id       BIGINT,
                visitor_id    VARCHAR(64)  NOT NULL,
                session_id    VARCHAR(64)  NOT NULL,
                event_type    VARCHAR(24)  NOT NULL,
                product_id    BIGINT,
                category_slug VARCHAR(160),
                search_query  VARCHAR(200),
                results_count INTEGER,
                quantity      INTEGER,
                price         NUMERIC(12, 3),
                page          VARCHAR(300),
                created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
                PRIMARY KEY (id, created_at)
            ) PARTITION BY RANGE (created_at)""",
            "CREATE TABLE IF NOT EXISTS user_events_default PARTITION OF user_events DEFAULT",
            "CREATE INDEX IF NOT EXISTS idx_user_events_shop_time ON user_events (shop_id, created_at DESC)",
            "CREATE INDEX IF NOT EXISTS idx_user_events_visitor ON user_events (shop_id, visitor_id, created_at DESC)",
            "CREATE INDEX IF NOT EXISTS idx_user_events_user ON user_events (user_id, created_at DESC) WHERE user_id IS NOT NULL",
            "CREATE INDEX IF NOT EXISTS idx_user_events_product ON user_events (shop_id, product_id, event_type) WHERE product_id IS NOT NULL",
            "CREATE INDEX IF NOT EXISTS brin_user_events_time ON user_events USING BRIN (created_at)",
            """
            CREATE TABLE IF NOT EXISTS product_stats_daily (
                shop_id     BIGINT  NOT NULL,
                product_id  BIGINT  NOT NULL,
                day         DATE    NOT NULL,
                views       INTEGER NOT NULL DEFAULT 0,
                clicks      INTEGER NOT NULL DEFAULT 0,
                add_to_cart INTEGER NOT NULL DEFAULT 0,
                wishlist    INTEGER NOT NULL DEFAULT 0,
                purchases   INTEGER NOT NULL DEFAULT 0,
                PRIMARY KEY (shop_id, day, product_id)
            )""",
            """
            CREATE TABLE IF NOT EXISTS search_stats_daily (
                shop_id      BIGINT       NOT NULL,
                day          DATE         NOT NULL,
                query        VARCHAR(200) NOT NULL,
                searches     INTEGER      NOT NULL DEFAULT 0,
                zero_results INTEGER      NOT NULL DEFAULT 0,
                clicks       INTEGER      NOT NULL DEFAULT 0,
                PRIMARY KEY (shop_id, day, query)
            )""",
            """
            CREATE TABLE IF NOT EXISTS product_recommendations (
                shop_id        BIGINT      NOT NULL,
                kind           VARCHAR(16) NOT NULL,
                product_id     BIGINT      NOT NULL,
                rank           SMALLINT    NOT NULL,
                rec_product_id BIGINT      NOT NULL,
                score          REAL        NOT NULL,
                PRIMARY KEY (shop_id, kind, product_id, rank)
            )""",
            """
            CREATE TABLE IF NOT EXISTS behavior_segments (
                shop_id     BIGINT      NOT NULL,
                subject     VARCHAR(80) NOT NULL,
                cluster     SMALLINT    NOT NULL,
                updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
                PRIMARY KEY (shop_id, subject)
            )""",
            """
            CREATE TABLE IF NOT EXISTS ml_model_runs (
                id         BIGSERIAL PRIMARY KEY,
                shop_id    BIGINT      NOT NULL,
                model      VARCHAR(32) NOT NULL,
                status     VARCHAR(16) NOT NULL,
                metrics    JSONB,
                trained_at TIMESTAMPTZ NOT NULL DEFAULT now()
            )""",
            "CREATE INDEX IF NOT EXISTS idx_ml_model_runs_shop ON ml_model_runs (shop_id, model, trained_at DESC)"
        );
        ddl.forEach(jdbc::execute);
        log.info("📊 Behaviour tracking schema ready");
    }

    /** Keeps partitions for last month → +2 months, and drops months older than the retention window. */
    @Scheduled(cron = "0 15 3 * * *")
    public void maintainPartitions() {
        YearMonth now = YearMonth.now();
        for (int offset = -1; offset <= 2; offset++) {
            YearMonth month = now.plusMonths(offset);
            String name = "user_events_" + month.format(SUFFIX);
            try {
                jdbc.execute("CREATE TABLE IF NOT EXISTS " + name + " PARTITION OF user_events FOR VALUES FROM ('"
                    + month.atDay(1) + "') TO ('" + month.plusMonths(1).atDay(1) + "')");
            } catch (Exception e) {
                // Rows for that month may already sit in the default partition; they stay queryable there.
                log.warn("Partition {} not created: {}", name, e.getMessage());
            }
        }
        LocalDate limit = now.minusMonths(RETENTION_MONTHS).atDay(1);
        List<String> old = jdbc.queryForList(
            "SELECT c.relname FROM pg_inherits i JOIN pg_class c ON c.oid = i.inhrelid "
                + "JOIN pg_class p ON p.oid = i.inhparent WHERE p.relname = 'user_events' AND c.relname ~ '^user_events_[0-9]{4}_[0-9]{2}$'",
            String.class);
        for (String partition : old) {
            YearMonth month = YearMonth.parse(partition.substring("user_events_".length()), SUFFIX);
            if (month.atDay(1).isBefore(limit)) {
                jdbc.execute("DROP TABLE IF EXISTS " + partition);
                log.info("🧹 Dropped event partition {}", partition);
            }
        }
    }
}
