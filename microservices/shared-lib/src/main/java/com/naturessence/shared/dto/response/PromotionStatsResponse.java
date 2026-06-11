package com.naturessence.shared.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class PromotionStatsResponse {

    private long couponsActifs;
    private long totalCoupons;
    private double totalRevenus;
    private long totalUtilisations;
    private double avgConversion;

    private long discountsActifs;
    private long totalDiscounts;

    /** Best performing coupon */
    private String bestCouponCode;
    private double bestCouponConversion;
    private double bestCouponRevenus;

    /** Worst performing coupon */
    private String worstCouponCode;
    private double worstCouponConversion;
}
