package com.naturessence.marketing.service;

import com.naturessence.shared.security.TenantGuard;
import com.naturessence.shared.dto.request.BannerRequest;
import com.naturessence.shared.dto.response.BannerResponse;
import com.naturessence.shared.entity.Banner;
import com.naturessence.shared.entity.Shop;
import com.naturessence.shared.enums.BannerAudience;
import com.naturessence.shared.enums.BannerPosition;
import com.naturessence.shared.enums.BannerStatut;
import com.naturessence.shared.repository.BannerRepository;
import com.naturessence.shared.repository.ShopRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BannerService {

    private final BannerRepository bannerRepository;
    private final ShopRepository shopRepository;

    // ── Admin: get all ────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<BannerResponse> getAll(String shopSlug) {
        Long shopId = shopIdOf(shopSlug);
        return bannerRepository.findAllByOrderByOrdreAscPrioriteAsc()
                .stream()
                .filter(banner -> shopId == null || shopId.equals(banner.getShopId()))
                .map(this::toResponse).collect(Collectors.toList());
    }

    // ── Admin: get by id ──────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public BannerResponse getById(Long id) {
        return toResponse(findOrThrow(id));
    }

    // ── Admin: create ─────────────────────────────────────────────────────────
    @Transactional
    public BannerResponse create(BannerRequest req) {
        Banner banner = Banner.builder()
                .titre(req.getTitre())
                .sousTitre(req.getSousTitre())
                .alignement(req.getAlignement() != null ? req.getAlignement() : "center")
                .imageUrl(req.getImageUrl())
                .mobileImageUrl(req.getMobileImageUrl())
                .videoUrl(req.getVideoUrl())
                .badgeTexte(req.getBadgeTexte())
                .badgeBgColor(req.getBadgeBgColor() != null ? req.getBadgeBgColor() : "rgba(255,255,255,0.15)")
                .badgeTextColor(req.getBadgeTextColor() != null ? req.getBadgeTextColor() : "#ffffff")
                .ctaTexte(req.getCtaTexte())
                .ctaType(req.getCtaType() != null ? req.getCtaType() : "produit")
                .ctaLien(req.getCtaLien())
                .position(req.getPosition())
                .audience(req.getAudience())
                .statut(req.getStatut())
                .priorite(req.getPriorite())
                .dateDebut(req.getDateDebut())
                .dateFin(req.getDateFin())
                .actif(req.isActif())
                .visibleHomepage(req.isVisibleHomepage())
                .visibleMobile(req.isVisibleMobile())
                .visibleDesktop(req.isVisibleDesktop())
                .shopId(resolveShopId(TenantGuard.shopForCreation(req.getShopSlug())))
                .ordre(req.getOrdre())
                .dureeSecondes(req.getDureeSecondes() > 0 ? req.getDureeSecondes() : 5)
                .animation(req.getAnimation() != null ? req.getAnimation() : "fade")
                .build();
        return toResponse(bannerRepository.save(banner));
    }

    // ── Admin: update ─────────────────────────────────────────────────────────
    @Transactional
    public BannerResponse update(Long id, BannerRequest req) {
        Banner banner = findOrThrow(id);
        banner.setTitre(req.getTitre());
        banner.setSousTitre(req.getSousTitre());
        banner.setAlignement(req.getAlignement() != null ? req.getAlignement() : "center");
        banner.setImageUrl(req.getImageUrl());
        banner.setMobileImageUrl(req.getMobileImageUrl());
        banner.setVideoUrl(req.getVideoUrl());
        banner.setBadgeTexte(req.getBadgeTexte());
        banner.setBadgeBgColor(req.getBadgeBgColor() != null ? req.getBadgeBgColor() : "rgba(255,255,255,0.15)");
        banner.setBadgeTextColor(req.getBadgeTextColor() != null ? req.getBadgeTextColor() : "#ffffff");
        banner.setCtaTexte(req.getCtaTexte());
        banner.setCtaType(req.getCtaType() != null ? req.getCtaType() : "produit");
        banner.setCtaLien(req.getCtaLien());
        banner.setPosition(req.getPosition());
        banner.setAudience(req.getAudience());
        banner.setStatut(req.getStatut());
        banner.setPriorite(req.getPriorite());
        banner.setDateDebut(req.getDateDebut());
        banner.setDateFin(req.getDateFin());
        banner.setActif(req.isActif());
        banner.setVisibleHomepage(req.isVisibleHomepage());
        banner.setVisibleMobile(req.isVisibleMobile());
        banner.setVisibleDesktop(req.isVisibleDesktop());
        banner.setOrdre(req.getOrdre());
        banner.setDureeSecondes(req.getDureeSecondes() > 0 ? req.getDureeSecondes() : 5);
        banner.setAnimation(req.getAnimation() != null ? req.getAnimation() : "fade");
        return toResponse(bannerRepository.save(banner));
    }

    // ── Admin: toggle actif ───────────────────────────────────────────────────
    @Transactional
    public BannerResponse toggleActif(Long id) {
        Banner banner = findOrThrow(id);
        boolean nowActif = !banner.isActif();
        banner.setActif(nowActif);
        banner.setStatut(nowActif ? BannerStatut.ACTIF : BannerStatut.BROUILLON);
        return toResponse(bannerRepository.save(banner));
    }

    // ── Admin: delete ─────────────────────────────────────────────────────────
    @Transactional
    public void delete(Long id) {
        bannerRepository.delete(findOrThrow(id));
    }

    // ── Public: get banners for homepage ──────────────────────────────────────
    @Transactional(readOnly = true)
    public List<BannerResponse> getPublicBanners(BannerPosition position, String segment) {
        LocalDate today = LocalDate.now();
        List<Banner> banners;
        if (segment != null && !segment.isBlank()) {
            try {
                BannerAudience audience = BannerAudience.valueOf(segment.toUpperCase());
                banners = bannerRepository.findPublicBanners(position, audience, today);
            } catch (IllegalArgumentException e) {
                banners = bannerRepository.findPublicBannersForGuest(position, today);
            }
        } else {
            banners = bannerRepository.findPublicBannersForGuest(position, today);
        }
        return banners.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BannerResponse> getPublicBanners(BannerPosition position, String segment, String shopSlug) {
        Long shopId = shopIdOf(shopSlug);
        LocalDate today = LocalDate.now();
        List<Banner> banners;
        if (segment != null && !segment.isBlank()) {
            try {
                BannerAudience audience = BannerAudience.valueOf(segment.toUpperCase());
                banners = bannerRepository.findPublicBanners(position, audience, today);
            } catch (IllegalArgumentException e) {
                banners = bannerRepository.findPublicBannersForGuest(position, today);
            }
        } else {
            banners = bannerRepository.findPublicBannersForGuest(position, today);
        }
        return banners.stream()
                .filter(banner -> shopId == null || shopId.equals(banner.getShopId()))
                .map(this::toResponse)
                .toList();
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

    // ── Helpers ───────────────────────────────────────────────────────────────
    private Banner findOrThrow(Long id) {
        Banner found = bannerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bannière introuvable: " + id));
        // Merchants only reach their own shop's records (TenantGuard).
        TenantGuard.assertOwned(found.getShopId(), shopRepository);
        return found;
    }

    private BannerResponse toResponse(Banner b) {
        return BannerResponse.builder()
                .id(b.getId())
                .titre(b.getTitre())
                .sousTitre(b.getSousTitre())
                .alignement(b.getAlignement() != null ? b.getAlignement() : "center")
                .imageUrl(b.getImageUrl())
                .mobileImageUrl(b.getMobileImageUrl())
                .videoUrl(b.getVideoUrl())
                .badgeTexte(b.getBadgeTexte())
                .badgeBgColor(b.getBadgeBgColor() != null ? b.getBadgeBgColor() : "rgba(255,255,255,0.15)")
                .badgeTextColor(b.getBadgeTextColor() != null ? b.getBadgeTextColor() : "#ffffff")
                .ctaTexte(b.getCtaTexte())
                .ctaType(b.getCtaType() != null ? b.getCtaType() : "produit")
                .ctaLien(b.getCtaLien())
                .position(b.getPosition())
                .positionLabel(b.getPosition().getLabel())
                .audience(b.getAudience())
                .audienceLabel(b.getAudience().getLabel())
                .statut(b.getStatut())
                .statutLabel(b.getStatut().getLabel())
                .priorite(b.getPriorite())
                .dateDebut(b.getDateDebut())
                .dateFin(b.getDateFin())
                .actif(b.isActif())
                .visibleHomepage(boolOrDefaultTrue(b.getVisibleHomepage()))
                .visibleMobile(boolOrDefaultTrue(b.getVisibleMobile()))
                .visibleDesktop(boolOrDefaultTrue(b.getVisibleDesktop()))
                .ordre(b.getOrdre())
                .dureeSecondes(b.getDureeSecondes())
                .animation(b.getAnimation() != null ? b.getAnimation() : "fade")
                .createdAt(b.getCreatedAt())
                .updatedAt(b.getUpdatedAt())
                .build();
    }

    private boolean boolOrDefaultTrue(Boolean value) {
        return value == null || value;
    }
}
