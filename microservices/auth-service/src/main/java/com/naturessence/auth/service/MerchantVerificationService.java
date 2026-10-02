package com.naturessence.auth.service;

import com.naturessence.shared.security.PlatformRoles;
import com.naturessence.shared.dto.request.MerchantVerificationRequest;
import com.naturessence.shared.entity.MerchantVerification;
import com.naturessence.shared.entity.Shop;
import com.naturessence.shared.entity.User;
import com.naturessence.shared.enums.AccountStatus;
import com.naturessence.shared.repository.MerchantVerificationRepository;
import com.naturessence.shared.repository.ShopRepository;
import com.naturessence.shared.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Identity checks that gate a merchant's backoffice until the Sellio admin approves them. */
@Service
@RequiredArgsConstructor
public class MerchantVerificationService {

    public static final String PENDING = "PENDING";
    public static final String APPROVED = "APPROVED";
    public static final String REJECTED = "REJECTED";

    private static final int MAX_IMAGE_CHARS = 6_000_000;

    private final MerchantVerificationRepository verificationRepository;
    private final ShopRepository shopRepository;
    private final UserRepository userRepository;
    private final RefreshTokenService refreshTokenService;

    /** Validates a submission and returns it; throws with a user-facing message otherwise. */
    public MerchantVerificationRequest requireComplete(MerchantVerificationRequest v) {
        if (v == null) {
            throw new IllegalArgumentException("La vérification d'identité est obligatoire pour ouvrir une boutique.");
        }
        String type = v.getDocumentType() == null ? "" : v.getDocumentType().trim().toUpperCase();
        if (!type.equals("CIN") && !type.equals("PASSPORT")) {
            throw new IllegalArgumentException("Choisissez une pièce d'identité : CIN ou passeport.");
        }
        String number = v.getDocumentNumber() == null ? "" : v.getDocumentNumber().replaceAll("\\s", "").toUpperCase();
        if (type.equals("CIN") && !number.matches("\\d{8}")) {
            throw new IllegalArgumentException("Le numéro de CIN doit contenir 8 chiffres.");
        }
        if (type.equals("PASSPORT") && !number.matches("[A-Z0-9]{6,12}")) {
            throw new IllegalArgumentException("Numéro de passeport invalide.");
        }
        requireImage(v.getDocumentFront(), "la photo de la pièce d'identité (recto)");
        if (type.equals("CIN")) requireImage(v.getDocumentBack(), "la photo du verso de la CIN");
        else if (v.getDocumentBack() != null && !v.getDocumentBack().isBlank()) requireImage(v.getDocumentBack(), "le verso");
        requireImage(v.getSelfie(), "le selfie");

        if (v.getStripePaymentMethodId() == null || !v.getStripePaymentMethodId().startsWith("pm_")) {
            throw new IllegalArgumentException("Ajoutez une carte bancaire valide.");
        }
        if (v.getCardLast4() == null || !v.getCardLast4().matches("\\d{4}")) {
            throw new IllegalArgumentException("Carte bancaire invalide.");
        }
        if (v.getCardExpMonth() == null || v.getCardExpYear() == null
                || YearMonth.of(v.getCardExpYear(), v.getCardExpMonth()).isBefore(YearMonth.now())) {
            throw new IllegalArgumentException("La carte bancaire est expirée.");
        }
        if (v.getCardholderName() == null || v.getCardholderName().isBlank()) {
            throw new IllegalArgumentException("Indiquez le nom du titulaire de la carte.");
        }
        v.setDocumentType(type);
        v.setDocumentNumber(number);
        return v;
    }

    @Transactional
    public MerchantVerification submit(Long userId, Long shopId, MerchantVerificationRequest v) {
        return verificationRepository.save(MerchantVerification.builder()
                .userId(userId)
                .shopId(shopId)
                .documentType(v.getDocumentType())
                .documentNumber(v.getDocumentNumber())
                .documentFront(v.getDocumentFront())
                .documentBack(blankToNull(v.getDocumentBack()))
                .selfie(v.getSelfie())
                .cardholderName(v.getCardholderName().trim())
                .cardBrand(v.getCardBrand())
                .cardLast4(v.getCardLast4())
                .cardExpMonth(v.getCardExpMonth())
                .cardExpYear(v.getCardExpYear())
                .stripePaymentMethodId(v.getStripePaymentMethodId())
                .stripeSetupIntentId(v.getStripeSetupIntentId())
                .status(PENDING)
                .build());
    }

    /** A rejected merchant sends a new file; the shop goes back to review. */
    @Transactional
    public Map<String, Object> resubmit(User user, MerchantVerificationRequest request) {
        Shop shop = ownedShop(user);
        if (!Shop.REJECTED.equals(Shop.statusOf(shop))) {
            throw new IllegalArgumentException("Votre dossier est déjà en cours de traitement.");
        }
        submit(user.getId(), shop.getId(), requireComplete(request));
        shop.setStatus(Shop.PENDING);
        shopRepository.save(shop);
        return statusFor(user);
    }

    public Map<String, Object> statusFor(User user) {
        Shop shop = ownedShop(user);
        MerchantVerification last = verificationRepository.findFirstByShopIdOrderBySubmittedAtDesc(shop.getId()).orElse(null);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("shopStatus", Shop.statusOf(shop));
        result.put("shopName", shop.getName());
        result.put("shopSlug", shop.getSlug());
        result.put("verificationStatus", last != null ? last.getStatus() : null);
        result.put("rejectionReason", last != null ? last.getRejectionReason() : null);
        result.put("submittedAt", last != null ? last.getSubmittedAt() : null);
        return result;
    }

    public List<Map<String, Object>> list() {
        return verificationRepository.findAllByOrderBySubmittedAtDesc().stream().map(v -> summary(v, false)).toList();
    }

    public Map<String, Object> detail(Long id) {
        return summary(find(id), true);
    }

    @Transactional
    public Map<String, Object> approve(Long id, String reviewer) {
        MerchantVerification v = find(id);
        v.setStatus(APPROVED);
        v.setRejectionReason(null);
        v.setReviewedAt(LocalDateTime.now());
        v.setReviewedBy(reviewer);
        verificationRepository.save(v);
        shopRepository.findById(v.getShopId()).ifPresent(shop -> {
            shop.setStatus(Shop.ACTIVE);
            shopRepository.save(shop);
        });
        return summary(v, false);
    }

    @Transactional
    public Map<String, Object> reject(Long id, String reason, String reviewer) {
        if (reason == null || reason.isBlank()) {
            throw new IllegalArgumentException("Indiquez le motif du refus : il sera affiché au marchand.");
        }
        MerchantVerification v = find(id);
        v.setStatus(REJECTED);
        v.setRejectionReason(reason.trim());
        v.setReviewedAt(LocalDateTime.now());
        v.setReviewedBy(reviewer);
        verificationRepository.save(v);
        shopRepository.findById(v.getShopId()).ifPresent(shop -> {
            shop.setStatus(Shop.REJECTED);
            shopRepository.save(shop);
        });
        return summary(v, false);
    }

    /** Suspending a shop also blocks its owner and ends their sessions; reactivating reverses both. */
    @Transactional
    public void setShopSuspended(Long shopId, boolean suspended) {
        Shop shop = shopRepository.findById(shopId)
                .orElseThrow(() -> new IllegalArgumentException("Boutique introuvable"));
        shop.setStatus(suspended ? Shop.SUSPENDED : Shop.ACTIVE);
        shopRepository.save(shop);
        if (shop.getOwnerId() != null) {
            userRepository.findById(shop.getOwnerId()).ifPresent(owner -> setUserBlocked(owner, suspended));
        }
    }

    @Transactional
    public void setUserBlocked(User user, boolean blocked) {
        if (user.getRole() != null && PlatformRoles.isPlatform(user.getRole().getName())) {
            throw new IllegalArgumentException("Un compte plateforme ne peut pas être bloqué.");
        }
        user.setStatus(blocked ? AccountStatus.BLOCKED : AccountStatus.ACTIVE);
        userRepository.save(user);
        if (blocked) refreshTokenService.deleteByUserId(user.getId());
    }

    private Map<String, Object> summary(MerchantVerification v, boolean withDocuments) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", v.getId());
        m.put("status", v.getStatus());
        m.put("submittedAt", v.getSubmittedAt());
        m.put("reviewedAt", v.getReviewedAt());
        m.put("reviewedBy", v.getReviewedBy());
        m.put("rejectionReason", v.getRejectionReason());
        m.put("documentType", v.getDocumentType());
        m.put("documentNumber", v.getDocumentNumber());
        m.put("cardholderName", v.getCardholderName());
        m.put("cardBrand", v.getCardBrand());
        m.put("cardLast4", v.getCardLast4());
        m.put("cardExpMonth", v.getCardExpMonth());
        m.put("cardExpYear", v.getCardExpYear());
        m.put("stripePaymentMethodId", v.getStripePaymentMethodId());
        shopRepository.findById(v.getShopId()).ifPresent(shop -> {
            m.put("shopId", shop.getId());
            m.put("shopName", shop.getName());
            m.put("shopSlug", shop.getSlug());
            m.put("businessType", shop.getBusinessType());
            m.put("shopStatus", Shop.statusOf(shop));
        });
        userRepository.findById(v.getUserId()).ifPresent(user -> {
            m.put("userId", user.getId());
            m.put("ownerName", (user.getFirstName() + " " + user.getLastName()).trim());
            m.put("ownerEmail", user.getEmail());
            m.put("ownerPhone", user.getPhone());
        });
        if (withDocuments) {
            m.put("documentFront", v.getDocumentFront());
            m.put("documentBack", v.getDocumentBack());
            m.put("selfie", v.getSelfie());
        }
        return m;
    }

    private MerchantVerification find(Long id) {
        return verificationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Dossier introuvable"));
    }

    private Shop ownedShop(User user) {
        if (user.getShopId() == null) {
            throw new IllegalArgumentException("Ce compte n'a pas encore de boutique");
        }
        return shopRepository.findById(user.getShopId())
                .orElseThrow(() -> new IllegalArgumentException("Boutique introuvable"));
    }

    private void requireImage(String value, String label) {
        if (value == null || value.isBlank() || !value.startsWith("data:image/")) {
            throw new IllegalArgumentException("Ajoutez " + label + ".");
        }
        if (value.length() > MAX_IMAGE_CHARS) {
            throw new IllegalArgumentException("L'image pour " + label + " est trop lourde.");
        }
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }
}
