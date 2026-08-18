package com.naturessence.catalog.service;

import com.naturessence.shared.entity.LoyaltyConfig;
import com.naturessence.shared.entity.PointsTransaction;
import com.naturessence.shared.entity.User;
import com.naturessence.shared.repository.LoyaltyConfigRepository;
import com.naturessence.shared.repository.PointsTransactionRepository;
import com.naturessence.shared.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Minimal loyalty service for the catalog microservice.
 * Only exposes {@link #awardPointsForReview(User)} which is the
 * single loyalty operation triggered from within this service boundary.
 */
@Service
@RequiredArgsConstructor
public class LoyaltyService {

    private final UserRepository userRepository;
    private final LoyaltyConfigRepository loyaltyConfigRepository;
    private final PointsTransactionRepository pointsTransactionRepository;

    /**
     * Awards the configured {@code pointsAvis} bonus to the user whenever
     * they submit a product review. Persists the updated points balance and
     * records a AVIS transaction for audit purposes.
     *
     * @param user the authenticated user who submitted the review
     */
    @Transactional
    public void awardPointsForReview(User user) {
        LoyaltyConfig cfg = loyaltyConfigRepository.findAll().stream()
                .findFirst()
                .orElse(null);

        int points = (cfg != null && cfg.getPointsAvis() != null) ? cfg.getPointsAvis() : 0;
        if (points <= 0) return;

        // Update user's running loyalty-points balance (never goes below zero)
        int current = user.getLoyaltyPoints() != null ? user.getLoyaltyPoints() : 0;
        user.setLoyaltyPoints(Math.max(0, current + points));
        userRepository.save(user);

        // Record an auditable transaction
        PointsTransaction tx = PointsTransaction.builder()
                .user(user)
                .orderId(null)
                .type("AVIS")
                .points(points)
                .description("Bonus pour avis client")
                .build();
        pointsTransactionRepository.save(tx);
    }
}
