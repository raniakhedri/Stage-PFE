package com.naturessence.marketing.controller;

import com.naturessence.marketing.service.AppearanceService;
import com.naturessence.shared.dto.response.AppearanceResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/public/appearance")
@RequiredArgsConstructor
public class PublicAppearanceController {

    private final AppearanceService appearanceService;

    @GetMapping("/{scope}")
    public ResponseEntity<AppearanceResponse> getSettings(@PathVariable String scope) {
        return ResponseEntity.ok(appearanceService.getByScope(scope));
    }
}
