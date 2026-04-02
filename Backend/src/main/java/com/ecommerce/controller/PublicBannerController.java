package com.ecommerce.controller;

import com.ecommerce.dto.response.ApiResponse;
import com.ecommerce.dto.response.BannerResponse;
import com.ecommerce.enums.BannerPosition;
import com.ecommerce.service.BannerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/public/banners")
@RequiredArgsConstructor
public class PublicBannerController {

    private final BannerService bannerService;

    /**
     * GET /api/v1/public/banners?position=HOMEPAGE_HERO&segment=VIP
     *
     * segment: optional, matches BannerAudience enum (ALL, VIP, NOUVEAU, FIDELE,
     * INACTIF)
     * If no segment provided → only ALL audience banners returned
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<BannerResponse>>> getPublicBanners(
            @RequestParam(defaultValue = "HOMEPAGE_HERO") String position,
            @RequestParam(required = false) String segment) {
        try {
            BannerPosition pos = BannerPosition.valueOf(position.toUpperCase());
            return ResponseEntity.ok(ApiResponse.ok(
                    "Bannières publiques",
                    bannerService.getPublicBanners(pos, segment)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Position invalide: " + position));
        }
    }
}
