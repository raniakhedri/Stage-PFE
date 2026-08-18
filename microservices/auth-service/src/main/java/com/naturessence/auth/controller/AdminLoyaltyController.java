package com.naturessence.auth.controller;

import com.naturessence.auth.service.LoyaltyService;
import com.naturessence.shared.dto.request.AdjustPointsRequest;
import com.naturessence.shared.dto.response.LeaderboardEntryResponse;
import com.naturessence.shared.dto.response.MessageResponse;
import com.naturessence.shared.entity.LoyaltyConfig;
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
