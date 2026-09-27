package com.naturessence.order.service;

import com.naturessence.shared.dto.request.CouponRequest;
import com.naturessence.shared.dto.response.CouponResponse;
import com.naturessence.shared.dto.response.PromotionStatsResponse;
import com.naturessence.shared.entity.Coupon;
import com.naturessence.shared.entity.CouponUsage;
import com.naturessence.shared.entity.Shop;
import com.naturessence.shared.entity.User;
import com.naturessence.shared.repository.CouponRepository;
import com.naturessence.shared.repository.ShopRepository;
import com.naturessence.shared.repository.CouponUsageRepository;
import com.naturessence.shared.repository.UserRepository;
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
    private final ShopRepository shopRepository;
    private final CouponUsageRepository couponUsageRepository;
    private final UserRepository userRepository;

    // ── Get all coupons ────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<CouponResponse> getAllCoupons(String shopSlug) {
        Long shopId = shopIdOf(shopSlug);
        return couponRepository.findAllOrderByCreatedAtDesc().stream()
                .filter(coupon -> shopId == null || shopId.equals(coupon.getShopId()))
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
                .shopId(resolveShopId(request.getShopSlug()))
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
        switch (coupon.getStatut()) {
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

        if (!"actif".equals(coupon.getStatut())) {
            throw new IllegalArgumentException("Ce coupon n'est pas actif");
        }

        LocalDate today = LocalDate.now();
        if (coupon.getDateDebut() != null && today.isBefore(coupon.getDateDebut())) {
            throw new IllegalArgumentException("Ce coupon n'est pas encore valide");
        }
        if (coupon.getDateFin() != null && today.isAfter(coupon.getDateFin())) {
            throw new IllegalArgumentException("Ce coupon a expiré");
        }

        if (coupon.getLimiteGlobale() > 0 && coupon.getUtilisations() >= coupon.getLimiteGlobale()) {
            throw new IllegalArgumentException("Ce coupon a atteint sa limite d'utilisation");
        }

        if (userId != null && coupon.getLimiteClient() > 0) {
            int userUsages = couponUsageRepository.countUsageByUserAndCoupon(coupon.getId(), userId);
            if (userUsages >= coupon.getLimiteClient()) {
                throw new IllegalArgumentException("Vous avez déjà utilisé ce coupon le nombre maximum de fois");
            }
        }

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

    // ── Public: top announcement coupon for frontoffice ─────────────────────
    @Transactional(readOnly = true)
    public Optional<CouponResponse> getTopAnnouncementCoupon(String shopSlug) {
        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();
        Long shopId = shopIdOf(shopSlug);

        return couponRepository.findActiveValidCouponsForDate(today)
                .stream()
                .filter(coupon -> isWithinTimeWindow(coupon, now))
                .filter(coupon -> shopId == null || shopId.equals(coupon.getShopId()))
                .findFirst()
                .map(this::mapToResponse);
    }

    private Long shopIdOf(String shopSlug) {
        if (shopSlug == null || shopSlug.isBlank()) return null;
        return shopRepository.findBySlug(shopSlug.trim().toLowerCase()).map(Shop::getId).orElse(-1L);
    }

    private Long resolveShopId(String shopSlug) {
        if (shopSlug == null || shopSlug.isBlank()) return null;
        return shopRepository.findBySlug(shopSlug.trim().toLowerCase())
                .map(Shop::getId)
                .orElseThrow(() -> new IllegalArgumentException("Boutique introuvable"));
    }

    // ── Use coupon (record usage) ──────────────────────────────────
    @Transactional
    public void useCoupon(Long couponId, Long userId, double orderAmount) {
        Coupon coupon = findOrThrow(couponId);

        coupon.setUtilisations(coupon.getUtilisations() + 1);
        coupon.setCommandes(coupon.getCommandes() + 1);
        coupon.setRevenus(coupon.getRevenus() + orderAmount);

        if (coupon.getLimiteGlobale() > 0) {
            coupon.setConversion((double) coupon.getCommandes() / coupon.getLimiteGlobale() * 100);
        }

        couponRepository.save(coupon);

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
    public PromotionStatsResponse getStats(String shopSlug) {
        Long shopId = shopIdOf(shopSlug);
        List<Coupon> allCoupons = couponRepository.findAll().stream()
                .filter(coupon -> shopId == null || (shopId > 0 && shopId.equals(coupon.getShopId())))
                .toList();
        if (shopId != null && shopId < 0) {
            allCoupons = List.of();
        }
        long actifs = allCoupons.stream().filter(coupon -> "actif".equals(coupon.getStatut())).count();
        long total = allCoupons.size();
        double revenus = allCoupons.stream().mapToDouble(Coupon::getRevenus).sum();
        long utilisations = allCoupons.stream().mapToLong(Coupon::getUtilisations).sum();
        double avgConv = allCoupons.stream().filter(coupon -> coupon.getConversion() > 0).mapToDouble(Coupon::getConversion).average().orElse(0);
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
                .totalRevenus(revenus)
                .totalUtilisations(utilisations)
                .avgConversion(avgConv)
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
        if ("brouillon".equals(requested))
            return "brouillon";
        LocalDate today = LocalDate.now();
        if (dateFin != null && today.isAfter(dateFin))
            return "expire";
        if (dateDebut != null && today.isBefore(dateDebut))
            return "planifie";
        return "actif";
    }

    private String joinList(List<String> items) {
        if (items == null || items.isEmpty())
            return null;
        return String.join(",", items);
    }

    private boolean isWithinTimeWindow(Coupon coupon, LocalTime now) {
        if (coupon.getHeureDebut() != null && now.isBefore(coupon.getHeureDebut())) {
            return false;
        }
        if (coupon.getHeureFin() != null && now.isAfter(coupon.getHeureFin())) {
            return false;
        }
        return true;
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
