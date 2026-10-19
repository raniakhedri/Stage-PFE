package com.naturessence.analytics.ml;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowCallbackHandler;
import org.springframework.jdbc.core.RowMapper;

@ExtendWith(MockitoExtension.class)
class RecommendationServiceTest {

    @Mock
    private JdbcTemplate jdbc;

    @InjectMocks
    private RecommendationService service;

    @Test
    void similar_usesTrainedNeighbours() {
        when(jdbc.query(contains("kind = 'SIMILAR'"), any(RowMapper.class), eq(3L), eq(9L), eq(4)))
            .thenReturn(List.of(new RecommendationService.Item(12L, 0.81)));

        RecommendationService.Result result = service.similar(3L, 9L, 4);

        assertThat(result.strategy()).isEqualTo("hybrid");
        assertThat(result.items()).containsExactly(new RecommendationService.Item(12L, 0.81));
    }

    @Test
    void similar_fallsBackToCategoryPopularity() {
        when(jdbc.query(contains("kind = 'SIMILAR'"), any(RowMapper.class), eq(3L), eq(9L), eq(4)))
            .thenReturn(List.of());
        when(jdbc.query(contains("category_id"), any(RowMapper.class), eq(9L), eq(3L), eq(9L), eq(4)))
            .thenReturn(List.of(new RecommendationService.Item(8L, 5.0)));

        RecommendationService.Result result = service.similar(3L, 9L, 4);

        assertThat(result.strategy()).isEqualTo("category_popularity");
        assertThat(result.items()).extracting(RecommendationService.Item::productId).containsExactly(8L);
    }

    @Test
    void boughtTogether_emptyCartReturnsEmpty() {
        RecommendationService.Result result = service.boughtTogether(1L, List.of(), 4);

        assertThat(result.strategy()).isEqualTo("empty");
        assertThat(result.items()).isEmpty();
    }

    @Test
    void popular_dropsExcludedProducts() {
        when(jdbc.query(contains("kind = 'POPULAR'"), any(RowMapper.class), eq(1L), eq(3)))
            .thenReturn(List.of(
                new RecommendationService.Item(1L, 1.0),
                new RecommendationService.Item(2L, 0.4)
            ));

        RecommendationService.Result result = service.popular(1L, 2, Set.of(1L));

        assertThat(result.strategy()).isEqualTo("popular");
        assertThat(result.items()).extracting(RecommendationService.Item::productId).containsExactly(2L);
    }

    @Test
    void forVisitor_withoutHistoryServesPopularity() {
        when(jdbc.queryForList(contains("user_events"), eq(2L), eq("visitor-1"))).thenReturn(List.of());
        when(jdbc.query(contains("kind = 'POPULAR'"), any(RowMapper.class), eq(2L), eq(4)))
            .thenReturn(List.of(new RecommendationService.Item(6L, 0.5)));

        RecommendationService.Result result = service.forVisitor(2L, "visitor-1", null, 4);

        assertThat(result.strategy()).isEqualTo("popular");
        assertThat(result.items()).extracting(RecommendationService.Item::productId).containsExactly(6L);
    }

    @Test
    void forVisitor_recentPurchaseIsExcludedFromPersonalisedList() {
        Map<String, Object> row = new HashMap<>();
        row.put("product_id", 5);
        row.put("event_type", "PURCHASE");
        row.put("created_at", Timestamp.from(Instant.now()));
        when(jdbc.queryForList(contains("user_events"), eq(2L), eq(""), eq(9L))).thenReturn(List.of(row));
        doNothing().when(jdbc).query(contains("r.kind = ?"), any(RowCallbackHandler.class), eq(2L), eq("SIMILAR"));
        when(jdbc.query(contains("kind = 'POPULAR'"), any(RowMapper.class), eq(2L), eq(5)))
            .thenReturn(List.of(new RecommendationService.Item(5L, 1.0), new RecommendationService.Item(7L, 0.2)));

        RecommendationService.Result result = service.forVisitor(2L, null, 9L, 4);

        assertThat(result.strategy()).isEqualTo("popular");
        assertThat(result.items()).extracting(RecommendationService.Item::productId).containsExactly(7L);
    }
}
