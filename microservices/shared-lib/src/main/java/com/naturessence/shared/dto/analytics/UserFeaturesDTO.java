package com.naturessence.shared.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Feature vector sent from the analytics-service to the Python churn model.
 * Field names mirror the columns in naturessence_churn_dataset.csv,
 * serialised as camelCase JSON by Jackson and mapped to snake_case
 * inside predict.py.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserFeaturesDTO {

    private Long userId;

    // ── Demographics ──────────────────────────────────────────────────────────
    private Integer age;
    private String gender; // "Male" | "Female" | "Other"
    private String city;
    private String gouvernorat;

    // ── Account lifecycle ─────────────────────────────────────────────────────
    private Long tenureDays;
    private Integer segmentId;
    private Integer loyaltyPoints;

    // ── Order behaviour ───────────────────────────────────────────────────────
    private Integer totalOrders;
    private Double totalSpent;
    private Double avgOrderValue;
    private Double orderFrequency; // orders per month

    // ── Engagement ────────────────────────────────────────────────────────────
    private Long daysSinceLastLogin;
    private Long daysSinceLastOrder;
    private Integer reviewCount;
    private Double avgRating;

    // ── Coupon / discount usage ───────────────────────────────────────────────
    private Integer couponUsageCount;
    private Double discountUserRatio; // couponUsageCount / totalOrders
}
