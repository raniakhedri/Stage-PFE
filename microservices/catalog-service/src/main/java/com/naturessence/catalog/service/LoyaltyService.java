package com.naturessence.catalog.service;

import com.naturessence.shared.entity.LoyaltyConfig;
import com.naturessence.shared.entity.PointsTransaction;
import com.naturessence.shared.entity.Segment;
import com.naturessence.shared.entity.User;
import com.naturessence.shared.repository.LoyaltyConfigRepository;
import com.naturessence.shared.repository.PointsTransactionRepository;
import com.naturessence.shared.repository.SegmentRepository;
import com.naturessence.shared.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;

/**
 * Loyalty operation triggered from the catalog: the review bonus, granted when the merchant approves
 * a review (once per review), followed by the automatic level upgrade like any other points gain.
 */
@Service
@RequiredArgsConstructor
public class LoyaltyService {

    private final UserRepository userRepository;
    private final SegmentRepository segmentRepository;
    private final LoyaltyConfigRepository loyaltyConfigRepository;
    private final PointsTransactionRepository pointsTransactionRepository;

    @Transactional
    public void awardPointsForReview(User user, Long reviewId) {
        if (user == null) return;
        String description = "Bonus pour avis client #" + reviewId;
        if (pointsTransactionRepository.existsByUser_IdAndTypeAndDescription(user.getId(), "AVIS", description)) return;

        LoyaltyConfig cfg = loyaltyConfigRepository.findAll().stream().findFirst().orElse(null);
        int points = (cfg != null && cfg.getPointsAvis() != null) ? cfg.getPointsAvis() : 0;
        if (points <= 0) return;

        int current = user.getLoyaltyPoints() != null ? user.getLoyaltyPoints() : 0;
        user.setLoyaltyPoints(Math.max(0, current + points));
        userRepository.save(user);

        pointsTransactionRepository.save(PointsTransaction.builder()
                .user(user)
                .orderId(null)
                .type("AVIS")
                .points(points)
                .description(description)
                .build());

        if (Boolean.TRUE.equals(cfg.getAutoSegmentPromotion())) promote(user);
    }

    /** Moves the customer up to the highest level whose threshold they reached (never down). */
    private void promote(User user) {
        int pts = user.getLoyaltyPoints() != null ? user.getLoyaltyPoints() : 0;
        segmentRepository.findAll().stream()
                .filter(s -> !s.getName().equalsIgnoreCase("INACTIF"))
                .filter(s -> s.getSeuilPoints() != null && s.getSeuilPoints() > 0 && pts >= s.getSeuilPoints())
                .max(Comparator.comparingInt(Segment::getSeuilPoints))
                .ifPresent(best -> {
                    Segment current = user.getSegment();
                    int currentSeuil = current != null && current.getSeuilPoints() != null ? current.getSeuilPoints() : 0;
                    if (best.getSeuilPoints() > currentSeuil) {
                        user.setSegment(best);
                        userRepository.save(user);
                    }
                });
    }
}
