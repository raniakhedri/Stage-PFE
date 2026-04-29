package com.ecommerce.service;

import com.ecommerce.dto.response.LeaderboardEntryResponse;
import com.ecommerce.dto.response.LoyaltyInfoResponse;
import com.ecommerce.dto.response.PointsTransactionResponse;
import com.ecommerce.dto.response.SegmentResponse;
import com.ecommerce.entity.LoyaltyConfig;
import com.ecommerce.entity.PointsTransaction;
import com.ecommerce.entity.Segment;
import com.ecommerce.entity.User;
import com.ecommerce.repository.LoyaltyConfigRepository;
import com.ecommerce.repository.PointsTransactionRepository;
import com.ecommerce.repository.SegmentRepository;
import com.ecommerce.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LoyaltyService {

    private final UserRepository userRepository;
    private final SegmentRepository segmentRepository;
    private final LoyaltyConfigRepository loyaltyConfigRepository;
    private final PointsTransactionRepository pointsTransactionRepository;

    // ── Config helpers ───────────────────────────────────────────────────────

    public LoyaltyConfig getOrCreateConfig() {
        return loyaltyConfigRepository.findAll().stream().findFirst()
                .orElseGet(() -> loyaltyConfigRepository.save(LoyaltyConfig.builder().build()));
    }

    @Transactional
    public LoyaltyConfig updateConfig(LoyaltyConfig incoming) {
        LoyaltyConfig cfg = getOrCreateConfig();
        if (incoming.getPointsParTnd() != null) cfg.setPointsParTnd(incoming.getPointsParTnd());
        if (incoming.getPointsBienvenue() != null) cfg.setPointsBienvenue(incoming.getPointsBienvenue());
        if (incoming.getPointsAvis() != null) cfg.setPointsAvis(incoming.getPointsAvis());
        if (incoming.getPointsAnniversaire() != null) cfg.setPointsAnniversaire(incoming.getPointsAnniversaire());
        if (incoming.getAutoSegmentPromotion() != null) cfg.setAutoSegmentPromotion(incoming.getAutoSegmentPromotion());
        return loyaltyConfigRepository.save(cfg);
    }

    // ── Points awarding ──────────────────────────────────────────────────────

    @Transactional
    public void awardPointsForOrder(User user, double orderTotal, Long orderId) {
        LoyaltyConfig cfg = getOrCreateConfig();
        double rate = cfg.getPointsParTnd() != null ? cfg.getPointsParTnd() : 1.0;
        double multiplier = user.getSegment() != null && user.getSegment().getMultiplicateurPoints() != null
                ? user.getSegment().getMultiplicateurPoints() : 1.0;
        int points = (int) Math.round(orderTotal * rate * multiplier);
        if (points <= 0) return;

        recordTransaction(user, points, orderId, "COMMANDE",
                String.format("Points pour commande (%.2f TND × %.1f × %.1f)", orderTotal, rate, multiplier));
        maybePromoteSegment(user, cfg);
    }

    @Transactional
    public void awardPointsForReview(User user) {
        LoyaltyConfig cfg = getOrCreateConfig();
        int points = cfg.getPointsAvis() != null ? cfg.getPointsAvis() : 0;
        if (points <= 0) return;
        recordTransaction(user, points, null, "AVIS", "Bonus pour avis client");
        maybePromoteSegment(user, cfg);
    }

    @Transactional
    public void awardWelcomePoints(User user) {
        LoyaltyConfig cfg = getOrCreateConfig();
        int points = cfg.getPointsBienvenue() != null ? cfg.getPointsBienvenue() : 0;
        if (points <= 0) return;
        recordTransaction(user, points, null, "BIENVENUE", "Bonus de bienvenue");
    }

    @Transactional
    public void adjustPoints(Long userId, int delta, String reason) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
        recordTransaction(user, delta, null, "AJUSTEMENT",
                reason != null && !reason.isBlank() ? reason : "Ajustement manuel");
        if (delta > 0) maybePromoteSegment(user, getOrCreateConfig());
    }

    // ── Loyalty info for profile ─────────────────────────────────────────────

    @Transactional(readOnly = true)
    public LoyaltyInfoResponse getLoyaltyInfo(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        int pts = user.getLoyaltyPoints() != null ? user.getLoyaltyPoints() : 0;

        List<Segment> eligibleTiers = segmentRepository.findAll().stream()
                .filter(s -> !s.getName().equalsIgnoreCase("INACTIF"))
                .filter(s -> s.getSeuilPoints() != null && s.getSeuilPoints() > 0)
                .sorted(Comparator.comparingInt(Segment::getSeuilPoints))
                .collect(Collectors.toList());

        // Next tier: lowest tier with seuil > current points
        Segment nextSegment = eligibleTiers.stream()
                .filter(s -> pts < s.getSeuilPoints())
                .findFirst()
                .orElse(null);

        List<PointsTransactionResponse> history = pointsTransactionRepository
                .findByUserIdOrderByCreatedAtDesc(userId).stream()
                .limit(20)
                .map(this::mapTransaction)
                .collect(Collectors.toList());

        return LoyaltyInfoResponse.builder()
                .points(pts)
                .currentSegment(mapSegment(user.getSegment(), userRepository))
                .nextSegment(nextSegment != null ? mapSegment(nextSegment, userRepository) : null)
                .history(history)
                .build();
    }

    // ── Leaderboard ──────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<LeaderboardEntryResponse> getLeaderboard(int limit) {
        List<User> top = userRepository.findTopClientsByLoyaltyPoints(PageRequest.of(0, limit));
        AtomicInteger rank = new AtomicInteger(1);
        return top.stream().map(u -> LeaderboardEntryResponse.builder()
                .rank(rank.getAndIncrement())
                .userId(u.getId())
                .fullName(u.getFullName())
                .email(u.getEmail())
                .loyaltyPoints(u.getLoyaltyPoints() != null ? u.getLoyaltyPoints() : 0)
                .segmentLabel(u.getSegment() != null ? u.getSegment().getLabel() : "")
                .segmentColor(u.getSegment() != null ? u.getSegment().getColor() : "")
                .build()).collect(Collectors.toList());
    }

    // ── Internal helpers ─────────────────────────────────────────────────────

    private void recordTransaction(User user, int points, Long orderId, String type, String description) {
        int current = user.getLoyaltyPoints() != null ? user.getLoyaltyPoints() : 0;
        user.setLoyaltyPoints(Math.max(0, current + points));
        userRepository.save(user);

        PointsTransaction tx = PointsTransaction.builder()
                .user(user)
                .orderId(orderId)
                .type(type)
                .points(points)
                .description(description)
                .build();
        pointsTransactionRepository.save(tx);
    }

    private void maybePromoteSegment(User user, LoyaltyConfig cfg) {
        if (!Boolean.TRUE.equals(cfg.getAutoSegmentPromotion())) return;
        int pts = user.getLoyaltyPoints() != null ? user.getLoyaltyPoints() : 0;

        segmentRepository.findAll().stream()
                .filter(s -> !s.getName().equalsIgnoreCase("INACTIF"))
                .filter(s -> s.getSeuilPoints() != null && s.getSeuilPoints() > 0)
                .filter(s -> pts >= s.getSeuilPoints())
                .max(Comparator.comparingInt(Segment::getSeuilPoints))
                .ifPresent(best -> {
                    Segment current = user.getSegment();
                    int currentSeuil = (current != null && current.getSeuilPoints() != null)
                            ? current.getSeuilPoints() : 0;
                    if (best.getSeuilPoints() > currentSeuil) {
                        user.setSegment(best);
                        userRepository.save(user);
                    }
                });
    }

    // ── Mappers ──────────────────────────────────────────────────────────────

    private PointsTransactionResponse mapTransaction(PointsTransaction tx) {
        return PointsTransactionResponse.builder()
                .id(tx.getId())
                .type(tx.getType())
                .points(tx.getPoints())
                .description(tx.getDescription())
                .orderId(tx.getOrderId())
                .createdAt(tx.getCreatedAt())
                .build();
    }

    public static SegmentResponse mapSegment(Segment s, UserRepository userRepository) {
        if (s == null) return null;
        return SegmentResponse.builder()
                .id(s.getId())
                .name(s.getName())
                .label(s.getLabel())
                .color(s.getColor())
                .description(s.getDescription())
                .icon(s.getIcon())
                .userCount(userRepository.countBySegmentId(s.getId()))
                .seuilPoints(s.getSeuilPoints())
                .multiplicateurPoints(s.getMultiplicateurPoints())
                .remiseAutomatique(s.getRemiseAutomatique())
                .remiseAnniversaire(s.getRemiseAnniversaire())
                .cashbackPourcentage(s.getCashbackPourcentage())
                .livraisonGratuiteStandard(s.getLivraisonGratuiteStandard())
                .livraisonGratuiteExpress(s.getLivraisonGratuiteExpress())
                .livraisonPrioritaire(s.getLivraisonPrioritaire())
                .cadeauAnniversaire(s.getCadeauAnniversaire())
                .emballageOffert(s.getEmballageOffert())
                .echantillonsGratuits(s.getEchantillonsGratuits())
                .accesAnticipe(s.getAccesAnticipe())
                .produitExclusif(s.getProduitExclusif())
                .invitationsEvenements(s.getInvitationsEvenements())
                .accesVentesPrivees(s.getAccesVentesPrivees())
                .prioriteSupport(s.getPrioriteSupport())
                .retourEtendu(s.getRetourEtendu())
                .conseillerPersonnel(s.getConseillerPersonnel())
                .badgeVisible(s.getBadgeVisible())
                .build();
    }
}
