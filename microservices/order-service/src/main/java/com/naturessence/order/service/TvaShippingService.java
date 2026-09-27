package com.naturessence.order.service;

import com.naturessence.shared.dto.request.ShippingZoneRequest;
import com.naturessence.shared.dto.request.TvaConfigRequest;
import com.naturessence.shared.dto.request.TvaRateRequest;
import com.naturessence.shared.dto.response.ShippingZoneResponse;
import com.naturessence.shared.dto.response.TvaConfigResponse;
import com.naturessence.shared.dto.response.TvaRateResponse;
import com.naturessence.shared.entity.ShippingZone;
import com.naturessence.shared.entity.TvaConfig;
import com.naturessence.shared.entity.TvaRate;
import com.naturessence.shared.repository.ShippingZoneRepository;
import com.naturessence.shared.repository.ShopRepository;
import com.naturessence.shared.repository.TvaConfigRepository;
import com.naturessence.shared.repository.TvaRateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TvaShippingService {

    private final TvaRateRepository tvaRateRepository;
    private final ShippingZoneRepository shippingZoneRepository;
    private final TvaConfigRepository tvaConfigRepository;
    private final ShopRepository shopRepository;

    // ════════════════════ TVA CONFIG (singleton row) ════════════════════

    @Transactional
    public TvaConfigResponse getConfig(String shopSlug) {
        TvaConfig c = getOrCreateConfig(shopSlug);
        return mapConfigToResponse(c);
    }

    @Transactional
    public TvaConfigResponse updateConfig(String shopSlug, TvaConfigRequest req) {
        TvaConfig c = getOrCreateConfig(shopSlug);
        if (req.getTvaActive() != null)
            c.setTvaActive(req.getTvaActive());
        if (req.getTauxDefaut() != null)
            c.setTauxDefaut(req.getTauxDefaut());
        if (req.getDevise() != null)
            c.setDevise(req.getDevise());
        if (req.getStandardEnabled() != null)
            c.setStandardEnabled(req.getStandardEnabled());
        if (req.getStandardSeuil() != null)
            c.setStandardSeuil(req.getStandardSeuil());
        if (req.getStandardDelai() != null)
            c.setStandardDelai(req.getStandardDelai());
        if (req.getExpressEnabled() != null)
            c.setExpressEnabled(req.getExpressEnabled());
        if (req.getExpressSeuil() != null)
            c.setExpressSeuil(req.getExpressSeuil());
        if (req.getExpressDelai() != null)
            c.setExpressDelai(req.getExpressDelai());
        tvaConfigRepository.save(c);
        return mapConfigToResponse(c);
    }

    private TvaConfig getOrCreateConfig(String shopSlug) {
        Long shopId = shopIdOf(shopSlug);
        if (shopId != null && shopId < 0) {
            return TvaConfig.builder().build();
        }
        if (shopId == null) {
            return tvaConfigRepository.findAll().stream().findFirst()
                    .orElseGet(() -> tvaConfigRepository.save(TvaConfig.builder().build()));
        }
        return tvaConfigRepository.findByShopId(shopId)
                .orElseGet(() -> tvaConfigRepository.save(TvaConfig.builder().shopId(shopId).build()));
    }

    private Long shopIdOf(String shopSlug) {
        if (shopSlug == null || shopSlug.isBlank()) return null;
        return shopRepository.findBySlug(shopSlug.trim().toLowerCase()).map(shop -> shop.getId()).orElse(-1L);
    }

    private void assertShop(Long entityShopId, String shopSlug) {
        Long shopId = shopIdOf(shopSlug);
        if (shopId == null) return;
        if (!shopId.equals(entityShopId)) {
            throw new IllegalArgumentException("Élément introuvable");
        }
    }

    private TvaConfigResponse mapConfigToResponse(TvaConfig c) {
        return TvaConfigResponse.builder()
                .tvaActive(c.getTvaActive())
                .tauxDefaut(c.getTauxDefaut())
                .devise(c.getDevise())
                .standardEnabled(c.getStandardEnabled())
                .standardSeuil(c.getStandardSeuil())
                .standardDelai(c.getStandardDelai())
                .expressEnabled(c.getExpressEnabled())
                .expressSeuil(c.getExpressSeuil())
                .expressDelai(c.getExpressDelai())
                .build();
    }

    // ════════════════════ TVA RATES ════════════════════

    @Transactional(readOnly = true)
    public List<TvaRateResponse> getAllRates(String shopSlug) {
        Long shopId = shopIdOf(shopSlug);
        List<TvaRate> rates = shopId == null
                ? tvaRateRepository.findAllByOrderByIdAsc()
                : shopId < 0 ? List.of() : tvaRateRepository.findByShopIdOrderByIdAsc(shopId);
        return rates.stream().map(this::mapRateToResponse).toList();
    }

    @Transactional
    public TvaRateResponse createRate(String shopSlug, TvaRateRequest req) {
        Long shopId = shopIdOf(shopSlug);
        if (shopId != null && shopId < 0) {
            throw new IllegalArgumentException("Boutique introuvable");
        }
        TvaRate rate = TvaRate.builder()
                .shopId(shopId)
                .nom(req.getNom().trim())
                .valeur(req.getValeur())
                .actif(true)
                .build();
        return mapRateToResponse(tvaRateRepository.save(rate));
    }

    @Transactional
    public TvaRateResponse updateRate(Long id, String shopSlug, TvaRateRequest req) {
        TvaRate rate = tvaRateRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Taux TVA introuvable"));
        assertShop(rate.getShopId(), shopSlug);
        rate.setNom(req.getNom().trim());
        rate.setValeur(req.getValeur());
        return mapRateToResponse(tvaRateRepository.save(rate));
    }

    @Transactional
    public TvaRateResponse toggleRate(Long id, String shopSlug) {
        TvaRate rate = tvaRateRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Taux TVA introuvable"));
        assertShop(rate.getShopId(), shopSlug);
        rate.setActif(!rate.getActif());
        return mapRateToResponse(tvaRateRepository.save(rate));
    }

    @Transactional
    public void deleteRate(Long id, String shopSlug) {
        TvaRate rate = tvaRateRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Taux TVA introuvable"));
        assertShop(rate.getShopId(), shopSlug);
        tvaRateRepository.delete(rate);
    }

    private TvaRateResponse mapRateToResponse(TvaRate r) {
        return TvaRateResponse.builder()
                .id(r.getId())
                .nom(r.getNom())
                .valeur(r.getValeur())
                .actif(r.getActif())
                .build();
    }

    // ════════════════════ SHIPPING ZONES ════════════════════

    @Transactional(readOnly = true)
    public List<ShippingZoneResponse> getAllZones(String shopSlug) {
        Long shopId = shopIdOf(shopSlug);
        List<ShippingZone> zones = shopId == null
                ? shippingZoneRepository.findAllByOrderByIdAsc()
                : shopId < 0 ? List.of() : shippingZoneRepository.findByShopIdOrderByIdAsc(shopId);
        return zones.stream().map(this::mapZoneToResponse).toList();
    }

    @Transactional
    public ShippingZoneResponse createZone(String shopSlug, ShippingZoneRequest req) {
        Long shopId = shopIdOf(shopSlug);
        if (shopId != null && shopId < 0) {
            throw new IllegalArgumentException("Boutique introuvable");
        }
        ShippingZone zone = ShippingZone.builder()
                .shopId(shopId)
                .nom(req.getNom().trim())
                .regions(req.getRegions().trim())
                .methode(req.getMethode())
                .estimation(req.getEstimation())
                .cout(req.getCout())
                .statut(req.getStatut() != null ? req.getStatut() : "Ouverte")
                .build();
        return mapZoneToResponse(shippingZoneRepository.save(zone));
    }

    @Transactional
    public ShippingZoneResponse updateZone(Long id, String shopSlug, ShippingZoneRequest req) {
        ShippingZone zone = shippingZoneRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Zone introuvable"));
        assertShop(zone.getShopId(), shopSlug);
        zone.setNom(req.getNom().trim());
        zone.setRegions(req.getRegions().trim());
        zone.setMethode(req.getMethode());
        zone.setEstimation(req.getEstimation());
        zone.setCout(req.getCout());
        if (req.getStatut() != null)
            zone.setStatut(req.getStatut());
        return mapZoneToResponse(shippingZoneRepository.save(zone));
    }

    @Transactional
    public void deleteZone(Long id, String shopSlug) {
        ShippingZone zone = shippingZoneRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Zone introuvable"));
        assertShop(zone.getShopId(), shopSlug);
        shippingZoneRepository.delete(zone);
    }

    private ShippingZoneResponse mapZoneToResponse(ShippingZone z) {
        return ShippingZoneResponse.builder()
                .id(z.getId())
                .nom(z.getNom())
                .regions(z.getRegions())
                .methode(z.getMethode())
                .estimation(z.getEstimation())
                .cout(z.getCout())
                .statut(z.getStatut())
                .build();
    }
}
