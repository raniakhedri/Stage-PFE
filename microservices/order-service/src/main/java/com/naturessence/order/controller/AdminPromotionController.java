package com.naturessence.order.controller;

import com.naturessence.order.service.CouponService;
import com.naturessence.order.service.DiscountService;
import com.naturessence.shared.dto.request.CouponRequest;
import com.naturessence.shared.dto.request.DiscountRequest;
import com.naturessence.shared.dto.response.CouponResponse;
import com.naturessence.shared.dto.response.DiscountResponse;
import com.naturessence.shared.dto.response.MessageResponse;
import com.naturessence.shared.dto.response.PromotionStatsResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/promotions")
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
@RequiredArgsConstructor
public class AdminPromotionController {

    private final CouponService couponService;
    private final DiscountService discountService;

    // ════════════════════════════════════════════════════════════════
    // STATS
    // ════════════════════════════════════════════════════════════════

    @GetMapping("/stats")
    public ResponseEntity<PromotionStatsResponse> getStats(@RequestParam(required = false) String shop) {
        return ResponseEntity.ok(couponService.getStats(shop));
    }

    // ════════════════════════════════════════════════════════════════
    // COUPONS
    // ════════════════════════════════════════════════════════════════

    @GetMapping("/coupons")
    public ResponseEntity<List<CouponResponse>> getAllCoupons(@RequestParam(required = false) String shop) {
        return ResponseEntity.ok(couponService.getAllCoupons(shop));
    }

    @GetMapping("/coupons/{id}")
    public ResponseEntity<CouponResponse> getCouponById(@PathVariable Long id) {
        return ResponseEntity.ok(couponService.getCouponById(id));
    }

    @PostMapping("/coupons")
    public ResponseEntity<CouponResponse> createCoupon(@Valid @RequestBody CouponRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(couponService.createCoupon(request));
    }

    @PutMapping("/coupons/{id}")
    public ResponseEntity<CouponResponse> updateCoupon(
            @PathVariable Long id,
            @Valid @RequestBody CouponRequest request) {
        return ResponseEntity.ok(couponService.updateCoupon(id, request));
    }

    @DeleteMapping("/coupons/{id}")
    public ResponseEntity<MessageResponse> deleteCoupon(@PathVariable Long id) {
        couponService.deleteCoupon(id);
        return ResponseEntity.ok(new MessageResponse("Coupon supprimé avec succès"));
    }

    @PatchMapping("/coupons/{id}/toggle")
    public ResponseEntity<CouponResponse> toggleCouponStatut(@PathVariable Long id) {
        return ResponseEntity.ok(couponService.toggleStatut(id));
    }

    // ════════════════════════════════════════════════════════════════
    // DISCOUNTS (Remise Rapide)
    // ════════════════════════════════════════════════════════════════

    @GetMapping("/discounts")
    public ResponseEntity<List<DiscountResponse>> getAllDiscounts() {
        return ResponseEntity.ok(discountService.getAllDiscounts());
    }

    @GetMapping("/discounts/{id}")
    public ResponseEntity<DiscountResponse> getDiscountById(@PathVariable Long id) {
        return ResponseEntity.ok(discountService.getDiscountById(id));
    }

    @PostMapping("/discounts")
    public ResponseEntity<DiscountResponse> createDiscount(@Valid @RequestBody DiscountRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(discountService.createDiscount(request));
    }

    @PutMapping("/discounts/{id}")
    public ResponseEntity<DiscountResponse> updateDiscount(
            @PathVariable Long id,
            @Valid @RequestBody DiscountRequest request) {
        return ResponseEntity.ok(discountService.updateDiscount(id, request));
    }

    @DeleteMapping("/discounts/{id}")
    public ResponseEntity<MessageResponse> deleteDiscount(@PathVariable Long id) {
        discountService.deleteDiscount(id);
        return ResponseEntity.ok(new MessageResponse("Remise supprimée avec succès"));
    }

    @PatchMapping("/discounts/{id}/toggle")
    public ResponseEntity<DiscountResponse> toggleDiscountStatut(@PathVariable Long id) {
        return ResponseEntity.ok(discountService.toggleStatut(id));
    }
}
