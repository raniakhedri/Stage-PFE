package com.naturessence.catalog.controller;

import com.naturessence.catalog.service.ProductService;
import com.naturessence.shared.dto.request.ProductRequest;
import com.naturessence.shared.dto.response.MessageResponse;
import com.naturessence.shared.dto.response.ProductResponse;
import com.naturessence.shared.dto.response.ProductStatsResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/products")
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
@RequiredArgsConstructor
public class AdminProductController {

    private final ProductService productService;

    @GetMapping
    public ResponseEntity<List<ProductResponse>> getAllProducts() {
        return ResponseEntity.ok(productService.getAllProducts());
    }

    @GetMapping("/stats")
    public ResponseEntity<ProductStatsResponse> getStats() {
        return ResponseEntity.ok(productService.getStats());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductResponse> getProductById(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getProductById(id));
    }

    @PostMapping
    public ResponseEntity<ProductResponse> createProduct(@Valid @RequestBody ProductRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(productService.createProduct(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProductResponse> updateProduct(
            @PathVariable Long id,
            @Valid @RequestBody ProductRequest request) {
        return ResponseEntity.ok(productService.updateProduct(id, request));
    }

    @PatchMapping("/{id}/archive")
    public ResponseEntity<ProductResponse> toggleArchive(@PathVariable Long id) {
        return ResponseEntity.ok(productService.toggleArchive(id));
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<ProductResponse> toggleDeactivate(@PathVariable Long id) {
        return ResponseEntity.ok(productService.toggleDeactivate(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<MessageResponse> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.ok(new MessageResponse("Produit supprimé avec succès"));
    }
}
