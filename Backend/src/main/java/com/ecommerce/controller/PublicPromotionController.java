package com.ecommerce.controller;

import com.ecommerce.dto.response.ApiResponse;
import com.ecommerce.dto.response.CouponResponse;
import com.ecommerce.dto.response.DiscountResponse;
import com.ecommerce.dto.response.PromotionAnnouncementResponse;
import com.ecommerce.service.CouponService;
import com.ecommerce.service.DiscountService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Locale;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/public/promotions")
@RequiredArgsConstructor
public class PublicPromotionController {

    private final CouponService couponService;
    private final DiscountService discountService;

    @GetMapping("/announcement")
    public ResponseEntity<ApiResponse<PromotionAnnouncementResponse>> getTopAnnouncement() {
        Optional<CouponResponse> activeCoupon = couponService.getLatestActiveCouponForAnnouncement();
        if (activeCoupon.isPresent()) {
            return ResponseEntity.ok(ApiResponse.ok(
                    "Annonce promotionnelle active",
                    fromCoupon(activeCoupon.get())
            ));
        }

        Optional<DiscountResponse> activeDiscount = discountService.getLatestActiveDiscountForAnnouncement();
        if (activeDiscount.isPresent()) {
            return ResponseEntity.ok(ApiResponse.ok(
                    "Annonce promotionnelle active",
                    fromDiscount(activeDiscount.get())
            ));
        }

        return ResponseEntity.ok(ApiResponse.ok("Aucune promotion active", null));
    }

    private PromotionAnnouncementResponse fromCoupon(CouponResponse coupon) {
        String message;
        String type = normalizeType(coupon.getType());
        switch (type) {
            case "livraison" -> {
                if (coupon.getMontantMin() > 0) {
                    message = "Livraison gratuite des " + formatAmount(coupon.getMontantMin()) + " TND d'achat";
                } else {
                    message = "Livraison gratuite sur votre commande";
                }
            }
            case "pourcentage" -> {
                message = coupon.getCode() + " : -" + formatAmount(coupon.getValeur()) + "%";
                if (coupon.getMontantMin() > 0) {
                    message += " des " + formatAmount(coupon.getMontantMin()) + " TND d'achat";
                }
            }
            case "fixe" -> {
                message = coupon.getCode() + " : -" + formatAmount(coupon.getValeur()) + " TND";
                if (coupon.getMontantMin() > 0) {
                    message += " des " + formatAmount(coupon.getMontantMin()) + " TND d'achat";
                }
            }
            case "bogo" -> message = coupon.getCode() + " : 1 acheté = 1 offert";
            case "cadeau" -> message = coupon.getCode() + " : cadeau offert";
            default -> message = coupon.getCode() + " : offre spéciale en cours";
        }

        return PromotionAnnouncementResponse.builder()
                .source("coupon")
                .message(message)
                .code(coupon.getCode())
            .type(type)
                .valeur(coupon.getValeur())
                .montantMin(coupon.getMontantMin())
                .build();
    }

    private PromotionAnnouncementResponse fromDiscount(DiscountResponse discount) {
        String target = "sur une sélection";
        if (discount.getProductName() != null && !discount.getProductName().isBlank()) {
            target = "sur " + discount.getProductName();
        } else if (discount.getCategoryName() != null && !discount.getCategoryName().isBlank()) {
            target = "sur " + discount.getCategoryName();
        }

        String message;
        String type = normalizeType(discount.getType());
        if ("pourcentage".equals(type)) {
            message = "Promo : -" + formatAmount(discount.getValeur()) + "% " + target;
        } else {
            message = "Promo : -" + formatAmount(discount.getValeur()) + " TND " + target;
        }

        return PromotionAnnouncementResponse.builder()
                .source("discount")
                .message(message)
                .code(null)
                .type(type)
                .valeur(discount.getValeur())
                .montantMin(null)
                .build();
    }

    private String normalizeType(String type) {
        if (type == null) {
            return "";
        }
        return type.trim().toLowerCase(Locale.ROOT);
    }

    private String formatAmount(double value) {
        if (value == Math.floor(value)) {
            return String.valueOf((long) value);
        }
        return String.valueOf(value);
    }
}
