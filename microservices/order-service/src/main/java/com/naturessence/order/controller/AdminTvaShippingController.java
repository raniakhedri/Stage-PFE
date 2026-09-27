package com.naturessence.order.controller;

import com.naturessence.order.service.TvaShippingService;
import com.naturessence.shared.dto.request.ShippingZoneRequest;
import com.naturessence.shared.dto.request.TvaConfigRequest;
import com.naturessence.shared.dto.request.TvaRateRequest;
import com.naturessence.shared.dto.response.MessageResponse;
import com.naturessence.shared.dto.response.ShippingZoneResponse;
import com.naturessence.shared.dto.response.TvaConfigResponse;
import com.naturessence.shared.dto.response.TvaRateResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/tva-shipping")
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
@RequiredArgsConstructor
public class AdminTvaShippingController {

    private final TvaShippingService service;

    // ── Global config ──────────────────────────────────────
    @GetMapping("/config")
    public ResponseEntity<TvaConfigResponse> getConfig(@RequestParam(required = false) String shop) {
        return ResponseEntity.ok(service.getConfig(shop));
    }

    @PutMapping("/config")
    public ResponseEntity<TvaConfigResponse> updateConfig(
            @RequestParam(required = false) String shop,
            @RequestBody TvaConfigRequest request) {
        return ResponseEntity.ok(service.updateConfig(shop, request));
    }

    // ── TVA rates ──────────────────────────────────────────
    @GetMapping("/rates")
    public ResponseEntity<List<TvaRateResponse>> getAllRates(@RequestParam(required = false) String shop) {
        return ResponseEntity.ok(service.getAllRates(shop));
    }

    @PostMapping("/rates")
    public ResponseEntity<TvaRateResponse> createRate(
            @RequestParam(required = false) String shop,
            @Valid @RequestBody TvaRateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.createRate(shop, request));
    }

    @PutMapping("/rates/{id}")
    public ResponseEntity<TvaRateResponse> updateRate(
            @PathVariable Long id,
            @RequestParam(required = false) String shop,
            @Valid @RequestBody TvaRateRequest request) {
        return ResponseEntity.ok(service.updateRate(id, shop, request));
    }

    @PatchMapping("/rates/{id}/toggle")
    public ResponseEntity<TvaRateResponse> toggleRate(
            @PathVariable Long id,
            @RequestParam(required = false) String shop) {
        return ResponseEntity.ok(service.toggleRate(id, shop));
    }

    @DeleteMapping("/rates/{id}")
    public ResponseEntity<MessageResponse> deleteRate(
            @PathVariable Long id,
            @RequestParam(required = false) String shop) {
        service.deleteRate(id, shop);
        return ResponseEntity.ok(new MessageResponse("Taux TVA supprimé avec succès"));
    }

    // ── Shipping zones ─────────────────────────────────────
    @GetMapping("/zones")
    public ResponseEntity<List<ShippingZoneResponse>> getAllZones(@RequestParam(required = false) String shop) {
        return ResponseEntity.ok(service.getAllZones(shop));
    }

    @PostMapping("/zones")
    public ResponseEntity<ShippingZoneResponse> createZone(
            @RequestParam(required = false) String shop,
            @Valid @RequestBody ShippingZoneRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.createZone(shop, request));
    }

    @PutMapping("/zones/{id}")
    public ResponseEntity<ShippingZoneResponse> updateZone(
            @PathVariable Long id,
            @RequestParam(required = false) String shop,
            @Valid @RequestBody ShippingZoneRequest request) {
        return ResponseEntity.ok(service.updateZone(id, shop, request));
    }

    @DeleteMapping("/zones/{id}")
    public ResponseEntity<MessageResponse> deleteZone(
            @PathVariable Long id,
            @RequestParam(required = false) String shop) {
        service.deleteZone(id, shop);
        return ResponseEntity.ok(new MessageResponse("Zone de livraison supprimée avec succès"));
    }
}
