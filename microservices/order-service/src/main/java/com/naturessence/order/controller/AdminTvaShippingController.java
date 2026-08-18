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
    public ResponseEntity<TvaConfigResponse> getConfig() {
        return ResponseEntity.ok(service.getConfig());
    }

    @PutMapping("/config")
    public ResponseEntity<TvaConfigResponse> updateConfig(@RequestBody TvaConfigRequest request) {
        return ResponseEntity.ok(service.updateConfig(request));
    }

    // ── TVA rates ──────────────────────────────────────────
    @GetMapping("/rates")
    public ResponseEntity<List<TvaRateResponse>> getAllRates() {
        return ResponseEntity.ok(service.getAllRates());
    }

    @PostMapping("/rates")
    public ResponseEntity<TvaRateResponse> createRate(@Valid @RequestBody TvaRateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.createRate(request));
    }

    @PutMapping("/rates/{id}")
    public ResponseEntity<TvaRateResponse> updateRate(
            @PathVariable Long id,
            @Valid @RequestBody TvaRateRequest request) {
        return ResponseEntity.ok(service.updateRate(id, request));
    }

    @PatchMapping("/rates/{id}/toggle")
    public ResponseEntity<TvaRateResponse> toggleRate(@PathVariable Long id) {
        return ResponseEntity.ok(service.toggleRate(id));
    }

    @DeleteMapping("/rates/{id}")
    public ResponseEntity<MessageResponse> deleteRate(@PathVariable Long id) {
        service.deleteRate(id);
        return ResponseEntity.ok(new MessageResponse("Taux TVA supprimé avec succès"));
    }

    // ── Shipping zones ─────────────────────────────────────
    @GetMapping("/zones")
    public ResponseEntity<List<ShippingZoneResponse>> getAllZones() {
        return ResponseEntity.ok(service.getAllZones());
    }

    @PostMapping("/zones")
    public ResponseEntity<ShippingZoneResponse> createZone(@Valid @RequestBody ShippingZoneRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.createZone(request));
    }

    @PutMapping("/zones/{id}")
    public ResponseEntity<ShippingZoneResponse> updateZone(
            @PathVariable Long id,
            @Valid @RequestBody ShippingZoneRequest request) {
        return ResponseEntity.ok(service.updateZone(id, request));
    }

    @DeleteMapping("/zones/{id}")
    public ResponseEntity<MessageResponse> deleteZone(@PathVariable Long id) {
        service.deleteZone(id);
        return ResponseEntity.ok(new MessageResponse("Zone de livraison supprimée avec succès"));
    }
}
