package com.ecommerce.service;

import com.ecommerce.dto.request.BannerRequest;
import com.ecommerce.dto.response.BannerResponse;
import com.ecommerce.entity.Banner;
import com.ecommerce.enums.BannerAudience;
import com.ecommerce.enums.BannerPosition;
import com.ecommerce.enums.BannerStatut;
import com.ecommerce.repository.BannerRepository;
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

    // ── Admin: get all ────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<BannerResponse> getAll() {
        return bannerRepository.findAllByOrderByOrdreAscPrioriteAsc()
                .stream().map(this::toResponse).collect(Collectors.toList());
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
                .imageUrl(req.getImageUrl())
                .ctaTexte(req.getCtaTexte())
                .ctaLien(req.getCtaLien())
                .position(req.getPosition())
                .audience(req.getAudience())
                .statut(req.getStatut())
                .priorite(req.getPriorite())
                .dateDebut(req.getDateDebut())
                .dateFin(req.getDateFin())
                .actif(req.isActif())
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
        banner.setImageUrl(req.getImageUrl());
        banner.setCtaTexte(req.getCtaTexte());
        banner.setCtaLien(req.getCtaLien());
        banner.setPosition(req.getPosition());
        banner.setAudience(req.getAudience());
        banner.setStatut(req.getStatut());
        banner.setPriorite(req.getPriorite());
        banner.setDateDebut(req.getDateDebut());
        banner.setDateFin(req.getDateFin());
        banner.setActif(req.isActif());
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

    // ── Helpers ───────────────────────────────────────────────────────────────
    private Banner findOrThrow(Long id) {
        return bannerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bannière introuvable: " + id));
    }

    private BannerResponse toResponse(Banner b) {
        return BannerResponse.builder()
                .id(b.getId())
                .titre(b.getTitre())
                .sousTitre(b.getSousTitre())
                .imageUrl(b.getImageUrl())
                .ctaTexte(b.getCtaTexte())
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
                .ordre(b.getOrdre())
                .dureeSecondes(b.getDureeSecondes())
                .animation(b.getAnimation() != null ? b.getAnimation() : "fade")
                .createdAt(b.getCreatedAt())
                .updatedAt(b.getUpdatedAt())
                .build();
    }
}
