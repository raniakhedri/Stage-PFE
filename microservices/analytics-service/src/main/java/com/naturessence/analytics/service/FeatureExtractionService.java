package com.naturessence.analytics.service;

import com.naturessence.shared.dto.analytics.UserFeaturesDTO;
import com.naturessence.shared.entity.Order;
import com.naturessence.shared.entity.Review;
import com.naturessence.shared.entity.User;
import com.naturessence.shared.enums.OrderStatus;
import com.naturessence.shared.repository.OrderRepository;
import com.naturessence.shared.repository.ReviewRepository;
import com.naturessence.shared.repository.UserRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.EnumSet;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class FeatureExtractionService {

    private static final EnumSet<OrderStatus> NON_PURCHASE = EnumSet.of(
        OrderStatus.ANNULEE,
        OrderStatus.REMBOURSEE
    );

    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final ReviewRepository reviewRepository;

    /**
     * Features known *today* (inference-time snapshot).
     * Same columns as the training table, which was built at a historical T.
     */
    public UserFeaturesDTO extract(Long userId) {
        User user = userRepository
            .findById(userId)
            .orElseThrow(() ->
                new IllegalArgumentException("User not found: " + userId)
            );

        LocalDateTime now = LocalDateTime.now();

        int age = 30;
        if (user.getDateOfBirth() != null) {
            age = (int) ChronoUnit.YEARS.between(user.getDateOfBirth(), LocalDate.now());
        }

        String gender = "Other";
        if (user.getGender() != null) {
            gender = switch (user.getGender()) {
                case HOMME -> "Male";
                case FEMME -> "Female";
            };
        }

        String city = user.getCity() != null ? user.getCity() : "Tunis";
        String gouvernorat = user.getGouvernorat() != null
            ? user.getGouvernorat()
            : city;

        long tenureDays = user.getCreatedAt() != null
            ? ChronoUnit.DAYS.between(user.getCreatedAt(), now)
            : 0L;

        int segmentId = (user.getSegment() != null && user.getSegment().getId() != null)
            ? user.getSegment().getId().intValue()
            : 1;

        int loyaltyPoints = user.getLoyaltyPoints() != null ? user.getLoyaltyPoints() : 0;

        List<Order> purchases = orderRepository
            .findByUserIdOrderByCreatedAtDesc(userId)
            .stream()
            .filter(o -> o.getStatus() == null || !NON_PURCHASE.contains(o.getStatus()))
            .toList();

        int totalOrders = purchases.size();
        double totalSpent = purchases
            .stream()
            .mapToDouble(o -> o.getTotal() != null ? o.getTotal() : 0.0)
            .sum();
        double avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0.0;
        double tenureMonths = Math.max(tenureDays / 30.0, 1.0);
        double orderFrequency = totalOrders / tenureMonths;

        long couponUsageCount = purchases
            .stream()
            .filter(o -> o.getCouponCode() != null && !o.getCouponCode().isBlank())
            .count();
        double discountUserRatio = totalOrders > 0
            ? (double) couponUsageCount / totalOrders
            : 0.0;

        long daysSinceLastOrder = tenureDays;
        if (!purchases.isEmpty() && purchases.get(0).getCreatedAt() != null) {
            daysSinceLastOrder = Math.max(
                0,
                ChronoUnit.DAYS.between(purchases.get(0).getCreatedAt(), now)
            );
        }

        long daysSinceLastLogin;
        if (user.getLastLogin() != null) {
            daysSinceLastLogin = Math.max(0, ChronoUnit.DAYS.between(user.getLastLogin(), now));
        } else {
            daysSinceLastLogin = daysSinceLastOrder;
        }

        List<Review> reviews = reviewRepository.findByUserIdOrderByCreatedAtDesc(userId);
        int reviewCount = reviews.size();
        double avgRating = reviews.stream().mapToInt(Review::getNote).average().orElse(0.0);

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
            .daysSinceLastOrder(daysSinceLastOrder)
            .reviewCount(reviewCount)
            .avgRating(avgRating)
            .couponUsageCount((int) couponUsageCount)
            .discountUserRatio(discountUserRatio)
            .build();
    }
}
