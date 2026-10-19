package com.naturessence.analytics.tracking;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.naturessence.analytics.ShopAccess;
import com.naturessence.analytics.config.SecurityConfig;
import com.naturessence.analytics.ml.RecommendationController;
import com.naturessence.analytics.ml.RecommendationService;
import com.naturessence.shared.entity.Shop;
import com.naturessence.shared.security.JwtUtil;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.web.servlet.MockMvc;

/** Keeps the slice off AnalyticsApplication, which would start JPA. */
@WebMvcTest(controllers = { TrackingController.class, RecommendationController.class })
@ContextConfiguration(classes = { TrackingController.class, RecommendationController.class, SecurityConfig.class })
@AutoConfigureMockMvc
class AnalyticsHttpTest {

    @Autowired
    private MockMvc mvc;

    @MockBean
    private JwtUtil jwtUtil;

    @MockBean
    private TrackingService trackingService;

    @MockBean
    private ShopAccess shopAccess;

    @MockBean
    private RecommendationService recommendationService;

    @Test
    void collect_isPublicAndReturnsStoredCount() throws Exception {
        Shop shop = Shop.builder().id(3L).name("Demo").slug("demo").build();
        when(shopAccess.bySlug("demo")).thenReturn(shop);
        when(shopAccess.currentUser()).thenReturn(null);
        when(trackingService.ingest(eq(3L), isNull(), any())).thenReturn(2);

        mvc.perform(post("/api/v1/analytics/events")
                .contentType("application/json")
                .content("""
                    {"shop":"demo","visitorId":"visitor-1","sessionId":"session-1",
                     "events":[{"type":"VIEW_PRODUCT","productId":9}]}
                    """))
            .andExpect(status().isAccepted())
            .andExpect(jsonPath("$.stored").value(2));
    }

    @Test
    void similar_isPublic() throws Exception {
        Shop shop = Shop.builder().id(3L).name("Demo").slug("demo").build();
        when(shopAccess.bySlug("demo")).thenReturn(shop);
        when(recommendationService.similar(3L, 9L, 8))
            .thenReturn(new RecommendationService.Result("hybrid", List.of(new RecommendationService.Item(12L, 0.5))));

        mvc.perform(get("/api/v1/analytics/recommendations/similar").param("shop", "demo").param("productId", "9"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.strategy").value("hybrid"))
            .andExpect(jsonPath("$.items[0].productId").value(12));
    }

    @Test
    void adminAnalytics_isRejectedWithoutARole() throws Exception {
        mvc.perform(get("/api/v1/analytics/behavior"))
            .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void adminAnalytics_reachesTheDispatcherForAnAdmin() throws Exception {
        mvc.perform(get("/api/v1/analytics/behavior"))
            .andExpect(status().isNotFound());
    }
}
