package com.naturessence.analytics.tracking;

import com.naturessence.analytics.ShopAccess;
import com.naturessence.shared.entity.Shop;
import com.naturessence.shared.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Public collection endpoint for the storefront tracker (batched, fire-and-forget).
 * The user id is never taken from the payload: it comes from the JWT when the shopper is logged in.
 */
@RestController
@RequestMapping("/api/v1/analytics/events")
@RequiredArgsConstructor
public class TrackingController {

    private final TrackingService trackingService;
    private final ShopAccess shopAccess;

    @PostMapping
    public ResponseEntity<Map<String, Integer>> collect(@RequestBody TrackingService.Batch batch) {
        Shop shop = shopAccess.bySlug(batch.shop());
        User user = shopAccess.currentUser();
        Long userId = user != null && shop.getId().equals(user.getShopId()) ? user.getId() : null;
        int stored = trackingService.ingest(shop.getId(), userId, batch);
        return ResponseEntity.accepted().body(Map.of("stored", stored));
    }
}
