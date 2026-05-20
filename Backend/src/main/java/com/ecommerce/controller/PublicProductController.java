package com.ecommerce.controller;

import com.ecommerce.dto.response.ProductResponse;
import com.ecommerce.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/public/products")
@RequiredArgsConstructor
public class PublicProductController {

    private final ProductService productService;

    @GetMapping
    public ResponseEntity<List<ProductResponse>> getPublicProducts() {
        return ResponseEntity.ok(productService.getPublicProducts());
    }

    @GetMapping("/category/{categoryId}")
    public ResponseEntity<List<ProductResponse>> getProductsByCategory(@PathVariable Long categoryId) {
        return ResponseEntity.ok(productService.getPublicProductsByCategory(categoryId));
    }

    @GetMapping("/parent-category/{parentId}")
    public ResponseEntity<List<ProductResponse>> getProductsByParentCategory(@PathVariable Long parentId) {
        return ResponseEntity.ok(productService.getPublicProductsByParentCategory(parentId));
    }

    @GetMapping("/collection/{collectionSlug}")
    public ResponseEntity<List<ProductResponse>> getProductsByCollection(@PathVariable String collectionSlug) {
        return ResponseEntity.ok(productService.getPublicProductsByCollectionSlug(collectionSlug));
    }

    @GetMapping("/by-ids")
    public ResponseEntity<List<ProductResponse>> getProductsByIds(@RequestParam String ids) {
        List<Long> idList = Arrays.stream(ids.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(Long::parseLong)
                .collect(Collectors.toList());
        return ResponseEntity.ok(productService.getPublicProductsByIds(idList));
    }

    @GetMapping("/{slug}")
    public ResponseEntity<ProductResponse> getProductBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(productService.getProductBySlug(slug));
    }
}
