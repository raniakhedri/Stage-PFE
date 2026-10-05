package com.naturessence.marketing.controller;

import com.naturessence.marketing.service.AppearanceService;
import com.naturessence.shared.dto.request.AppearanceRequest;
import com.naturessence.shared.dto.response.AppearanceResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/appearance")
/** Sellio's default look (no shop). Shops customise theirs through PATCH /auth/my-shop (settings). */
@PreAuthorize("hasRole('SUPER_ADMIN')")
@RequiredArgsConstructor
public class AdminAppearanceController {

    private final AppearanceService appearanceService;

    @GetMapping("/{scope}")
    public ResponseEntity<AppearanceResponse> getSettings(@PathVariable String scope) {
        return ResponseEntity.ok(appearanceService.getByScope(scope));
    }

    @PutMapping("/{scope}")
    public ResponseEntity<AppearanceResponse> updateSettings(
            @PathVariable String scope,
            @RequestBody AppearanceRequest request) {
        return ResponseEntity.ok(appearanceService.updateByScope(scope, request));
    }

    @PostMapping("/{scope}/reset")
    public ResponseEntity<AppearanceResponse> resetSettings(@PathVariable String scope) {
        return ResponseEntity.ok(appearanceService.resetByScope(scope));
    }
}
