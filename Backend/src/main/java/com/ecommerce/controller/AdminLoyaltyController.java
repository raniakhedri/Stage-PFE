package com.ecommerce.controller;

import com.ecommerce.dto.request.AdjustPointsRequest;
import com.ecommerce.dto.response.LeaderboardEntryResponse;
import com.ecommerce.dto.response.MessageResponse;
import com.ecommerce.entity.LoyaltyConfig;
import com.ecommerce.service.LoyaltyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/loyalty")
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
@RequiredArgsConstructor
public class AdminLoyaltyController {

    private final LoyaltyService loyaltyService;

    @GetMapping("/config")
    public ResponseEntity<LoyaltyConfig> getConfig() {
        return ResponseEntity.ok(loyaltyService.getOrCreateConfig());
    }

    @PutMapping("/config")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<LoyaltyConfig> updateConfig(@RequestBody LoyaltyConfig config) {
        return ResponseEntity.ok(loyaltyService.updateConfig(config));
    }

    @GetMapping("/leaderboard")
    public ResponseEntity<List<LeaderboardEntryResponse>> getLeaderboard(
            @RequestParam(defaultValue = "20") int limit) {
        return ResponseEntity.ok(loyaltyService.getLeaderboard(limit));
    }

    @PostMapping("/users/{userId}/adjust-points")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<MessageResponse> adjustPoints(
            @PathVariable Long userId,
            @RequestBody AdjustPointsRequest request) {
        loyaltyService.adjustPoints(userId, request.getDelta(), request.getReason());
        return ResponseEntity.ok(new MessageResponse("Points mis à jour avec succès"));
    }
}
