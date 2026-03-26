package com.ecommerce.controller;

import com.ecommerce.dto.request.AppearanceRequest;
import com.ecommerce.dto.response.AppearanceResponse;
import com.ecommerce.dto.response.MessageResponse;
import com.ecommerce.service.AppearanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/appearance")
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
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
