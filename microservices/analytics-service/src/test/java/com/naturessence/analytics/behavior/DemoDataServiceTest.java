package com.naturessence.analytics.behavior;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;

@ExtendWith(MockitoExtension.class)
class DemoDataServiceTest {

    @Mock
    private JdbcTemplate jdbc;

    @InjectMocks
    private DemoDataService service;

    @Test
    void generate_rejectsShopWithFewerThanThreeActiveProducts() {
        when(jdbc.queryForList(contains("products"), eq(9L))).thenReturn(List.of(
            Map.of("id", 1, "nom", "Savon", "category", 1, "sale_price", 8),
            Map.of("id", 2, "nom", "Huile", "category", 1, "sale_price", 12)
        ));

        assertThatThrownBy(() -> service.generate(9L, 4))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("3 produits");
    }

    @Test
    void generate_insertsDemoEventsAndRebuildsAggregates() {
        when(jdbc.queryForList(contains("products"), eq(5L))).thenReturn(List.of(
            Map.of("id", 1, "nom", "Huile argan", "category", 1, "sale_price", 10),
            Map.of("id", 2, "nom", "Savon", "category", 1, "sale_price", 8),
            Map.of("id", 3, "nom", "Creme", "category", 2, "sale_price", 12)
        ));

        Map<String, Object> result = service.generate(5L, 2);

        assertThat(result).containsEntry("visitors", 2);
        assertThat((Integer) result.get("events")).isPositive();
        verify(jdbc).batchUpdate(contains("INSERT INTO user_events"), anyList());
        verify(jdbc).update(contains("DELETE FROM product_stats_daily"), eq(5L));
        verify(jdbc).update(contains("DELETE FROM search_stats_daily"), eq(5L));
    }

    @Test
    void purge_deletesOnlyDemoVisitorsThenRebuilds() {
        when(jdbc.update(contains("visitor_id LIKE 'demo-%'"), eq(4L))).thenReturn(7);

        Map<String, Object> result = service.purge(4L);

        assertThat(result).containsEntry("deletedEvents", 7);
        verify(jdbc).update(contains("behavior_segments"), eq(4L));
        verify(jdbc).update(contains("DELETE FROM product_stats_daily"), eq(4L));
        verify(jdbc).update(contains("INSERT INTO product_stats_daily"), eq(4L));
    }

    @Test
    void prefix_marksEveryGeneratedVisitor() {
        assertThat(DemoDataService.PREFIX).isEqualTo("demo-");
    }
}
