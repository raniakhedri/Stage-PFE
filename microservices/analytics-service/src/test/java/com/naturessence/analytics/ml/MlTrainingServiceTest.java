package com.naturessence.analytics.ml;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.naturessence.shared.entity.Shop;
import com.naturessence.shared.repository.ShopRepository;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.support.TransactionTemplate;

@ExtendWith(MockitoExtension.class)
class MlTrainingServiceTest {

    private final ObjectMapper mapper = new ObjectMapper();

    @Mock
    private JdbcTemplate jdbc;

    @Mock
    private TransactionTemplate tx;

    @Mock
    private PythonRunner python;

    @Mock
    private ShopRepository shopRepository;

    @InjectMocks
    private MlTrainingService service;

    @BeforeEach
    void stubTransaction() {
        lenient().doNothing().when(tx).executeWithoutResult(any());
    }

    @Test
    void trainAll_skipsShopsThatAreNotLive() throws Exception {
        Shop pending = Shop.builder().id(1L).name("Attente").slug("attente").status(Shop.PENDING).build();
        Shop live = Shop.builder().id(2L).name("Live").slug("live").status(Shop.ACTIVE).build();
        when(shopRepository.findAll()).thenReturn(List.of(pending, live));
        when(jdbc.queryForList(contains("products"), eq(2L))).thenReturn(List.of());
        when(jdbc.queryForList(contains("user_events"), eq(2L), eq(90))).thenReturn(List.of());
        when(python.run(eq("segment"), any())).thenReturn(mapper.readTree("{\"subjects\":[],\"metrics\":{},\"profiles\":[]}"));

        service.trainAll();

        verify(jdbc, never()).queryForList(contains("products"), eq(1L));
        verify(jdbc).update(contains("ml_model_runs"), eq(2L), eq("recommender"), eq("SKIPPED"), anyString());
    }

    @Test
    void trainRecommender_skipsWhenFewerThanTwoActiveProducts() throws Exception {
        when(jdbc.queryForList(contains("products"), eq(5L))).thenReturn(List.of(Map.of("id", 1)));

        JsonNode result = service.trainRecommender(5L);

        assertThat(result.get("status").asText()).isEqualTo("SKIPPED");
        assertThat(result.get("reason").asText()).contains("2 produits");
        verify(python, never()).run(anyString(), any());
    }

    @Test
    void trainSegmentation_marksSkippedWhenNoSubjects() throws Exception {
        when(jdbc.queryForList(anyString(), anyLong(), eq(90))).thenReturn(List.of());
        when(python.run(eq("segment"), any())).thenReturn(mapper.readTree(
            "{\"subjects\":[],\"metrics\":{\"clusters\":0},\"profiles\":[]}"
        ));

        JsonNode result = service.trainSegmentation(8L);

        assertThat(result.get("status").asText()).isEqualTo("SKIPPED");
        verify(tx).executeWithoutResult(any());
    }

    @Test
    void trainShop_returnsBothModels() throws Exception {
        when(jdbc.queryForList(contains("products"), eq(4L))).thenReturn(List.of());
        when(jdbc.queryForList(contains("user_events"), eq(4L), eq(90))).thenReturn(List.of());
        when(python.run(eq("segment"), any())).thenReturn(mapper.readTree(
            "{\"subjects\":[[\"v:demo\",1]],\"metrics\":{},\"profiles\":[]}"
        ));

        Map<String, Object> result = service.trainShop(4L);

        assertThat(result).containsKeys("recommender", "segmentation");
        assertThat(((JsonNode) result.get("recommender")).get("status").asText()).isEqualTo("SKIPPED");
        assertThat(((JsonNode) result.get("segmentation")).get("status").asText()).isEqualTo("OK");
    }
}
