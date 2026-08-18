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

    // ════════════════════ TVA CONFIG (singleton row) ════════════════════

    @Transactional(readOnly = true)
    public TvaConfigResponse getConfig() {
        TvaConfig c = getOrCreateConfig();
        return mapConfigToResponse(c);
    }

    @Transactional
    public TvaConfigResponse updateConfig(TvaConfigRequest req) {
        TvaConfig c = getOrCreateConfig();
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

    private TvaConfig getOrCreateConfig() {
        return tvaConfigRepository.findAll().stream().findFirst()
                .orElseGet(() -> tvaConfigRepository.save(TvaConfig.builder().build()));
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
    public List<TvaRateResponse> getAllRates() {
        return tvaRateRepository.findAllByOrderByIdAsc().stream()
                .map(this::mapRateToResponse).toList();
    }

    @Transactional
    public TvaRateResponse createRate(TvaRateRequest req) {
        TvaRate rate = TvaRate.builder()
                .nom(req.getNom().trim())
                .valeur(req.getValeur())
                .actif(true)
                .build();
        return mapRateToResponse(tvaRateRepository.save(rate));
    }

    @Transactional
    public TvaRateResponse updateRate(Long id, TvaRateRequest req) {
        TvaRate rate = tvaRateRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Taux TVA introuvable"));
        rate.setNom(req.getNom().trim());
        rate.setValeur(req.getValeur());
        return mapRateToResponse(tvaRateRepository.save(rate));
    }

    @Transactional
    public TvaRateResponse toggleRate(Long id) {
        TvaRate rate = tvaRateRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Taux TVA introuvable"));
        rate.setActif(!rate.getActif());
        return mapRateToResponse(tvaRateRepository.save(rate));
    }

    @Transactional
    public void deleteRate(Long id) {
        if (!tvaRateRepository.existsById(id)) {
            throw new IllegalArgumentException("Taux TVA introuvable");
        }
        tvaRateRepository.deleteById(id);
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
    public List<ShippingZoneResponse> getAllZones() {
        return shippingZoneRepository.findAllByOrderByIdAsc().stream()
                .map(this::mapZoneToResponse).toList();
    }

    @Transactional
    public ShippingZoneResponse createZone(ShippingZoneRequest req) {
        ShippingZone zone = ShippingZone.builder()
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
    public ShippingZoneResponse updateZone(Long id, ShippingZoneRequest req) {
        ShippingZone zone = shippingZoneRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Zone introuvable"));
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
    public void deleteZone(Long id) {
        if (!shippingZoneRepository.existsById(id)) {
            throw new IllegalArgumentException("Zone introuvable");
        }
        shippingZoneRepository.deleteById(id);
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
