package com.naturessence.analytics.tracking;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.startsWith;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;

@ExtendWith(MockitoExtension.class)
class TrackingServiceTest {

    @Mock
    private JdbcTemplate jdbc;

    @InjectMocks
    private TrackingService service;

    @Test
    void normalizeQuery_stripsAccentsAndCollapsesSpaces() {
        assertThat(TrackingService.normalizeQuery("  Robe LIN écrue ")).isEqualTo("robe lin ecrue");
        assertThat(TrackingService.normalizeQuery("   ")).isNull();
        assertThat(TrackingService.normalizeQuery(null)).isNull();
    }

    @Test
    void ingest_rejectsMissingIdentifiers() {
        TrackingService.Batch batch = new TrackingService.Batch("demo", "short", "session-1", List.of());

        assertThatThrownBy(() -> service.ingest(1L, null, batch))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("obligatoires");
    }

    @Test
    void ingest_dropsUnknownTypesAndStoresNothing() {
        TrackingService.Batch batch = new TrackingService.Batch(
            "demo",
            "visitor-1",
            "session-1",
            List.of(new TrackingService.Event("NOT_A_TYPE", 1L, null, null, null, null, null, null, null))
        );

        assertThat(service.ingest(1L, null, batch)).isZero();
        verify(jdbc, never()).batchUpdate(any(), anyList(), any(int[].class));
    }

    @Test
    void ingest_storesViewAndNormalizesSearch() {
        TrackingService.Event view = new TrackingService.Event(
            "VIEW_PRODUCT", 42L, "soins", null, null, null, 12.5, "/produit", null
        );
        TrackingService.Event search = new TrackingService.Event(
            "SEARCH", null, null, "  Huile d'Argan ", 0, null, null, "/recherche", null
        );
        TrackingService.Batch batch = new TrackingService.Batch("demo", "visitor-1", "session-1", List.of(view, search));

        int stored = service.ingest(3L, 8L, batch);

        assertThat(stored).isEqualTo(2);
        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<Object[]>> rows = ArgumentCaptor.forClass(List.class);
        verify(jdbc).batchUpdate(startsWith("INSERT INTO user_events"), rows.capture(), any(int[].class));
        assertThat(rows.getValue()).hasSize(2);
        assertThat(rows.getValue().get(0)[4]).isEqualTo("VIEW_PRODUCT");
        assertThat(rows.getValue().get(0)[5]).isEqualTo(42L);
        assertThat(rows.getValue().get(1)[7]).isEqualTo("huile d'argan");
        verify(jdbc).batchUpdate(startsWith("INSERT INTO product_stats_daily"), anyList());
        verify(jdbc).batchUpdate(startsWith("INSERT INTO search_stats_daily"), anyList());
    }

    @Test
    void ingest_rateLimitsAVisitorAfter240Events() {
        TrackingService.Event view = new TrackingService.Event(
            "PAGE_VIEW", null, null, null, null, null, null, "/", null
        );
        List<TrackingService.Event> full = new ArrayList<>();
        for (int i = 0; i < 50; i++) {
            full.add(view);
        }
        TrackingService.Batch batch = new TrackingService.Batch("demo", "visitor-9", "session-9", full);

        assertThat(service.ingest(1L, null, batch)).isEqualTo(50);
        assertThat(service.ingest(1L, null, batch)).isEqualTo(50);
        assertThat(service.ingest(1L, null, batch)).isEqualTo(50);
        assertThat(service.ingest(1L, null, batch)).isEqualTo(50);
        assertThat(service.ingest(1L, null, batch)).isZero();
    }
}
