package com.ecommerce.service;

import com.ecommerce.dto.request.CouponRequest;
import com.ecommerce.dto.response.CouponResponse;
import com.ecommerce.dto.response.PromotionStatsResponse;
import com.ecommerce.entity.Coupon;
import com.ecommerce.entity.CouponUsage;
import com.ecommerce.entity.User;
import com.ecommerce.repository.CouponRepository;
import com.ecommerce.repository.CouponUsageRepository;
import com.ecommerce.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CouponService {

    private final CouponRepository couponRepository;
    private final CouponUsageRepository couponUsageRepository;
    private final UserRepository userRepository;

    // ── Get all coupons ────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<CouponResponse> getAllCoupons() {
        return couponRepository.findAllOrderByCreatedAtDesc().stream()
                .map(this::mapToResponse)
                .toList();
    }

    // ── Get coupon by ID ───────────────────────────────────────────
    @Transactional(readOnly = true)
    public CouponResponse getCouponById(Long id) {
        return mapToResponse(findOrThrow(id));
    }

    // ── Create coupon ──────────────────────────────────────────────
    @Transactional
    public CouponResponse createCoupon(CouponRequest request) {
        String code = request.getCode().trim().toUpperCase();

        if (couponRepository.existsByCode(code)) {
            throw new IllegalArgumentException("Un coupon avec ce code existe déjà: " + code);
        }

        // Auto-compute statut based on dates
        String statut = computeStatut(request.getStatut(), request.getDateDebut(), request.getDateFin());

        Coupon coupon = Coupon.builder()
                .code(code)
                .type(request.getType())
                .valeur(request.getValeur())
                .montantMin(request.getMontantMin())
                .dateDebut(request.getDateDebut())
                .dateFin(request.getDateFin())
                .heureDebut(request.getHeureDebut())
                .heureFin(request.getHeureFin())
                .statut(statut)
                .limiteGlobale(request.getLimiteGlobale())
                .limiteClient(request.getLimiteClient())
                .segment(request.getSegment())
                .categories(joinList(request.getCategories()))
                .produits(joinList(request.getProduits()))
                .auto(request.isAuto())
                .autoTrigger(request.getAutoTrigger())
                .build();

        coupon = couponRepository.save(coupon);
        return mapToResponse(coupon);
    }

    // ── Update coupon ──────────────────────────────────────────────
    @Transactional
    public CouponResponse updateCoupon(Long id, CouponRequest request) {
        Coupon coupon = findOrThrow(id);

        String newCode = request.getCode().trim().toUpperCase();
        if (!coupon.getCode().equals(newCode) && couponRepository.existsByCode(newCode)) {
            throw new IllegalArgumentException("Un coupon avec ce code existe déjà: " + newCode);
        }

        String statut = computeStatut(request.getStatut(), request.getDateDebut(), request.getDateFin());

        coupon.setCode(newCode);
        coupon.setType(request.getType());
        coupon.setValeur(request.getValeur());
        coupon.setMontantMin(request.getMontantMin());
        coupon.setDateDebut(request.getDateDebut());
        coupon.setDateFin(request.getDateFin());
        coupon.setHeureDebut(request.getHeureDebut());
        coupon.setHeureFin(request.getHeureFin());
        coupon.setStatut(statut);
        coupon.setLimiteGlobale(request.getLimiteGlobale());
        coupon.setLimiteClient(request.getLimiteClient());
        coupon.setSegment(request.getSegment());
        coupon.setCategories(joinList(request.getCategories()));
        coupon.setProduits(joinList(request.getProduits()));
        coupon.setAuto(request.isAuto());
        coupon.setAutoTrigger(request.getAutoTrigger());

        coupon = couponRepository.save(coupon);
        return mapToResponse(coupon);
    }

    // ── Delete coupon ──────────────────────────────────────────────
    @Transactional
    public void deleteCoupon(Long id) {
        Coupon coupon = findOrThrow(id);
        couponUsageRepository.deleteByCouponId(id);
        couponRepository.delete(coupon);
    }

    // ── Toggle statut ──────────────────────────────────────────────
    @Transactional
    public CouponResponse toggleStatut(Long id) {
        Coupon coupon = findOrThrow(id);
        String statut = normalizeStatut(coupon.getStatut());
        switch (statut) {
            case "actif" -> coupon.setStatut("brouillon");
            case "brouillon", "planifie" -> coupon.setStatut("actif");
            default -> throw new IllegalArgumentException("Impossible de changer le statut d'un coupon expiré");
        }
        coupon = couponRepository.save(coupon);
        return mapToResponse(coupon);
    }

    // ── Validate coupon for a user ─────────────────────────────────
    @Transactional(readOnly = true)
    public CouponResponse validateCoupon(String code, Long userId) {
        Coupon coupon = couponRepository.findByCode(code.trim().toUpperCase())
                .orElseThrow(() -> new IllegalArgumentException("Code coupon introuvable: " + code));

        if (!"actif".equals(normalizeStatut(coupon.getStatut()))) {
            throw new IllegalArgumentException("Ce coupon n'est pas actif");
        }

        // Check date validity
        LocalDate today = LocalDate.now();
        if (coupon.getDateDebut() != null && today.isBefore(coupon.getDateDebut())) {
            throw new IllegalArgumentException("Ce coupon n'est pas encore valide");
        }
        if (coupon.getDateFin() != null && today.isAfter(coupon.getDateFin())) {
            throw new IllegalArgumentException("Ce coupon a expiré");
        }

        // Check global limit
        if (coupon.getLimiteGlobale() > 0 && coupon.getUtilisations() >= coupon.getLimiteGlobale()) {
            throw new IllegalArgumentException("Ce coupon a atteint sa limite d'utilisation");
        }

        // Check per-user limit
        if (userId != null && coupon.getLimiteClient() > 0) {
            int userUsages = couponUsageRepository.countUsageByUserAndCoupon(coupon.getId(), userId);
            if (userUsages >= coupon.getLimiteClient()) {
                throw new IllegalArgumentException("Vous avez déjà utilisé ce coupon le nombre maximum de fois");
            }
        }

        // Check segment match
        if (coupon.getSegment() != null && !coupon.getSegment().isEmpty() && !"tous".equals(coupon.getSegment())) {
            if (userId != null) {
                User user = userRepository.findById(userId)
                        .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable"));
                if (user.getSegment() == null || !user.getSegment().getName().equalsIgnoreCase(coupon.getSegment())) {
                    throw new IllegalArgumentException("Ce coupon n'est pas disponible pour votre segment");
                }
            }
        }

        return mapToResponse(coupon);
    }

    // ── Frontoffice: latest active coupon for top announcement ─────
    @Transactional(readOnly = true)
    public Optional<CouponResponse> getLatestActiveCouponForAnnouncement() {
        return couponRepository.findByStatutIgnoreCaseOrderByCreatedAtDesc("actif")
                .stream()
                .filter(this::isCouponCurrentlyValid)
                .findFirst()
                .map(this::mapToResponse);
    }

    // ── Use coupon (record usage) ──────────────────────────────────
    @Transactional
    public void useCoupon(Long couponId, Long userId, double orderAmount) {
        Coupon coupon = findOrThrow(couponId);

        coupon.setUtilisations(coupon.getUtilisations() + 1);
        coupon.setCommandes(coupon.getCommandes() + 1);
        coupon.setRevenus(coupon.getRevenus() + orderAmount);

        // Recalculate conversion
        if (coupon.getLimiteGlobale() > 0) {
            coupon.setConversion((double) coupon.getCommandes() / coupon.getLimiteGlobale() * 100);
        }

        couponRepository.save(coupon);

        // Track per-user usage
        if (userId != null) {
            Optional<CouponUsage> existing = couponUsageRepository.findByCouponIdAndUserId(couponId, userId);
            if (existing.isPresent()) {
                CouponUsage usage = existing.get();
                usage.setCount(usage.getCount() + 1);
                couponUsageRepository.save(usage);
            } else {
                User user = userRepository.findById(userId)
                        .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable"));
                CouponUsage usage = CouponUsage.builder()
                        .coupon(coupon)
                        .user(user)
                        .count(1)
                        .build();
                couponUsageRepository.save(usage);
            }
        }
    }

    // ── Stats / KPIs ───────────────────────────────────────────────
    @Transactional(readOnly = true)
    public PromotionStatsResponse getStats() {
        long actifs = couponRepository.countByStatut("actif");
        long total = couponRepository.count();
        Double revenus = couponRepository.sumRevenus();
        Long utilisations = couponRepository.sumUtilisations();
        Double avgConv = couponRepository.avgConversion();

        // Best & worst performing
        List<Coupon> allCoupons = couponRepository.findAll();
        Coupon best = allCoupons.stream()
                .filter(c -> c.getConversion() > 0)
                .max(Comparator.comparingDouble(Coupon::getConversion))
                .orElse(null);
        Coupon worst = allCoupons.stream()
                .filter(c -> !"brouillon".equals(c.getStatut()) && !"planifie".equals(c.getStatut())
                        && c.getUtilisations() > 0)
                .min(Comparator.comparingDouble(Coupon::getConversion))
                .orElse(null);

        return PromotionStatsResponse.builder()
                .couponsActifs(actifs)
                .totalCoupons(total)
                .totalRevenus(revenus != null ? revenus : 0)
                .totalUtilisations(utilisations != null ? utilisations : 0)
                .avgConversion(avgConv != null ? avgConv : 0)
                .bestCouponCode(best != null ? best.getCode() : null)
                .bestCouponConversion(best != null ? best.getConversion() : 0)
                .bestCouponRevenus(best != null ? best.getRevenus() : 0)
                .worstCouponCode(
                        worst != null && (best == null || !worst.getId().equals(best.getId())) ? worst.getCode() : null)
                .worstCouponConversion(
                        worst != null && (best == null || !worst.getId().equals(best.getId())) ? worst.getConversion()
                                : 0)
                .build();
    }

    // ── Helpers ────────────────────────────────────────────────────

    private Coupon findOrThrow(Long id) {
        return couponRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Coupon introuvable avec l'ID: " + id));
    }

    private String computeStatut(String requested, LocalDate dateDebut, LocalDate dateFin) {
        String normalizedRequested = normalizeStatut(requested);
        if ("brouillon".equals(normalizedRequested))
            return "brouillon";
        LocalDate today = LocalDate.now();
        if (dateFin != null && today.isAfter(dateFin))
            return "expire";
        if (dateDebut != null && today.isBefore(dateDebut))
            return "planifie";
        return "actif";
    }

    private String normalizeStatut(String statut) {
        if (statut == null) {
            return "";
        }
        return statut.trim().toLowerCase(Locale.ROOT);
    }

    private boolean isCouponCurrentlyValid(Coupon coupon) {
        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();

        if (coupon.getDateDebut() != null && today.isBefore(coupon.getDateDebut())) {
            return false;
        }
        if (coupon.getDateFin() != null && today.isAfter(coupon.getDateFin())) {
            return false;
        }
        if (coupon.getHeureDebut() != null && now.isBefore(coupon.getHeureDebut())) {
            return false;
        }
        if (coupon.getHeureFin() != null && now.isAfter(coupon.getHeureFin())) {
            return false;
        }
        return true;
    }

    private String joinList(List<String> items) {
        if (items == null || items.isEmpty())
            return null;
        return String.join(",", items);
    }

    private List<String> splitList(String csv) {
        if (csv == null || csv.isBlank())
            return List.of();
        return Arrays.stream(csv.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }

    private CouponResponse mapToResponse(Coupon c) {
        return CouponResponse.builder()
                .id(c.getId())
                .code(c.getCode())
                .type(c.getType())
                .valeur(c.getValeur())
                .montantMin(c.getMontantMin())
                .dateDebut(c.getDateDebut())
                .dateFin(c.getDateFin())
                .heureDebut(c.getHeureDebut())
                .heureFin(c.getHeureFin())
                .statut(c.getStatut())
                .utilisations(c.getUtilisations())
                .limiteGlobale(c.getLimiteGlobale())
                .limiteClient(c.getLimiteClient())
                .segment(c.getSegment())
                .categories(splitList(c.getCategories()))
                .produits(splitList(c.getProduits()))
                .revenus(c.getRevenus())
                .commandes(c.getCommandes())
                .conversion(c.getConversion())
                .auto(c.isAuto())
                .autoTrigger(c.getAutoTrigger())
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }
}
