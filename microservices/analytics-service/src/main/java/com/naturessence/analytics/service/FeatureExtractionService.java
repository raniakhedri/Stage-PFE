package com.naturessence.analytics.service;

import com.naturessence.shared.dto.analytics.UserFeaturesDTO;
import com.naturessence.shared.entity.Order;
import com.naturessence.shared.entity.Review;
import com.naturessence.shared.entity.User;
import com.naturessence.shared.repository.OrderRepository;
import com.naturessence.shared.repository.ReviewRepository;
import com.naturessence.shared.repository.UserRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class FeatureExtractionService {

    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final ReviewRepository reviewRepository;

    /**
     * Extracts the full ML feature vector for a user from the live database.
     * Feature names and semantics match naturessence_churn_dataset.csv exactly.
     */
    public UserFeaturesDTO extract(Long userId) {
        User user = userRepository
            .findById(userId)
            .orElseThrow(() ->
                new IllegalArgumentException("User not found: " + userId)
            );

        LocalDateTime now = LocalDateTime.now();

        // ── Demographics ──────────────────────────────────────────────────────
        int age = 30; // fallback when date of birth is not set
        if (user.getDateOfBirth() != null) {
            age = (int) ChronoUnit.YEARS.between(
                user.getDateOfBirth(),
                LocalDate.now()
            );
        }

        // Map DB enum (HOMME/FEMME) to the training labels (Male/Female/Other)
        String gender = "Other";
        if (user.getGender() != null) {
            gender = switch (user.getGender()) {
                case HOMME -> "Male";
                case FEMME -> "Female";
            };
        }

        String city = user.getCity() != null ? user.getCity() : "Tunis";
        String gouvernorat =
            user.getGouvernorat() != null ? user.getGouvernorat() : "Tunis";

        // ── Account lifecycle ─────────────────────────────────────────────────
        long tenureDays =
            user.getCreatedAt() != null
                ? ChronoUnit.DAYS.between(user.getCreatedAt(), now)
                : 0L;

        int segmentId = (user.getSegment() != null &&
            user.getSegment().getId() != null)
            ? user.getSegment().getId().intValue()
            : 1;

        int loyaltyPoints =
            user.getLoyaltyPoints() != null ? user.getLoyaltyPoints() : 0;

        // ── Days since last login ─────────────────────────────────────────────
        long daysSinceLastLogin =
            user.getLastLogin() != null
                ? ChronoUnit.DAYS.between(user.getLastLogin(), now)
                : 999L;

        // ── Order behaviour ───────────────────────────────────────────────────
        List<Order> orders = orderRepository.findByUserIdOrderByCreatedAtDesc(
            userId
        );

        int totalOrders = orders.size();
        double totalSpent = orders.stream().mapToDouble(Order::getTotal).sum();
        double avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0.0;

        // order_frequency = orders per month over the account lifetime
        double tenureMonths = Math.max(tenureDays / 30.0, 1.0);
        double orderFrequency = totalOrders / tenureMonths;

        // coupon_usage_count = orders that were placed with a coupon code
        long couponUsageCount = orders
            .stream()
            .filter(
                o -> o.getCouponCode() != null && !o.getCouponCode().isBlank()
            )
            .count();

        // discount_user_ratio = fraction of orders that used a coupon
        double discountUserRatio =
            totalOrders > 0 ? (double) couponUsageCount / totalOrders : 0.0;

        // ── Engagement / reviews ──────────────────────────────────────────────
        List<Review> reviews =
            reviewRepository.findByUserIdOrderByCreatedAtDesc(userId);

        int reviewCount = reviews.size();
        double avgRating = reviews
            .stream()
            .mapToInt(Review::getNote)
            .average()
            .orElse(0.0);

        return UserFeaturesDTO.builder()
            .userId(userId)
            .age(age)
            .gender(gender)
            .city(city)
            .gouvernorat(gouvernorat)
            .tenureDays(tenureDays)
            .segmentId(segmentId)
            .loyaltyPoints(loyaltyPoints)
            .totalOrders(totalOrders)
            .totalSpent(totalSpent)
            .avgOrderValue(avgOrderValue)
            .orderFrequency(orderFrequency)
            .daysSinceLastLogin(daysSinceLastLogin)
            .reviewCount(reviewCount)
            .avgRating(avgRating)
            .couponUsageCount((int) couponUsageCount)
            .discountUserRatio(discountUserRatio)
            .build();
    }
}
