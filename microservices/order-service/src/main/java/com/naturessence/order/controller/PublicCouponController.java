package com.naturessence.order.controller;

import com.naturessence.order.service.CouponService;
import com.naturessence.shared.dto.response.CouponResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/public/coupons")
@RequiredArgsConstructor
public class PublicCouponController {

    private final CouponService couponService;

    /**
     * Validate a coupon code (frontoffice checkout).
     * Optionally pass userId to check per-user limits.
     */
    @GetMapping("/validate")
    public ResponseEntity<CouponResponse> validateCoupon(
            @RequestParam String code,
            @RequestParam(required = false) Long userId) {
        return ResponseEntity.ok(couponService.validateCoupon(code, userId));
    }

    /**
     * Return the top currently active coupon for the frontoffice announcement bar.
     * Responds 204 when no active coupon is available.
     */
    @GetMapping("/announcement")
    public ResponseEntity<CouponResponse> getAnnouncementCoupon(@RequestParam(required = false) String shop) {
        return couponService.getTopAnnouncementCoupon(shop)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NO_CONTENT).build());
    }
}
