package com.ecommerce.controller;

import com.ecommerce.dto.request.BannerRequest;
import com.ecommerce.dto.response.ApiResponse;
import com.ecommerce.dto.response.BannerResponse;
import com.ecommerce.service.BannerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/banners")
@RequiredArgsConstructor
public class AdminBannerController {

    private final BannerService bannerService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<BannerResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.ok("Liste des bannières", bannerService.getAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BannerResponse>> getById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(ApiResponse.ok("Bannière trouvée", bannerService.getById(id)));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<ApiResponse<BannerResponse>> create(@Valid @RequestBody BannerRequest request) {
        try {
            return ResponseEntity.ok(ApiResponse.ok("Bannière créée avec succès", bannerService.create(request)));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<BannerResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody BannerRequest request) {
        try {
            return ResponseEntity.ok(ApiResponse.ok("Bannière mise à jour", bannerService.update(id, request)));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PatchMapping("/{id}/toggle")
    public ResponseEntity<ApiResponse<BannerResponse>> toggleActif(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(ApiResponse.ok("Statut modifié", bannerService.toggleActif(id)));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        try {
            bannerService.delete(id);
            return ResponseEntity.ok(ApiResponse.ok("Bannière supprimée"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}
