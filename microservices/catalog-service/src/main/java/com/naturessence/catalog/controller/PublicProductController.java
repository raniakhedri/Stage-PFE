package com.naturessence.catalog.controller;

import com.naturessence.catalog.service.ProductService;
import com.naturessence.shared.dto.response.ProductResponse;
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
    public ResponseEntity<List<ProductResponse>> getPublicProducts(@RequestParam(required = false) String shop) {
        return ResponseEntity.ok(productService.getPublicProducts(shop));
    }

    @GetMapping("/category/{categoryId}")
    public ResponseEntity<List<ProductResponse>> getProductsByCategory(@PathVariable Long categoryId,
                                                                        @RequestParam(required = false) String shop) {
        return ResponseEntity.ok(productService.getPublicProductsByCategory(categoryId, shop));
    }

    @GetMapping("/parent-category/{parentId}")
    public ResponseEntity<List<ProductResponse>> getProductsByParentCategory(@PathVariable Long parentId,
                                                                              @RequestParam(required = false) String shop) {
        return ResponseEntity.ok(productService.getPublicProductsByParentCategory(parentId, shop));
    }

    @GetMapping("/collection/{collectionSlug}")
    public ResponseEntity<List<ProductResponse>> getProductsByCollection(@PathVariable String collectionSlug,
                                                                          @RequestParam(required = false) String shop) {
        return ResponseEntity.ok(productService.getPublicProductsByCollectionSlug(collectionSlug, shop));
    }

    @GetMapping("/by-ids")
    public ResponseEntity<List<ProductResponse>> getProductsByIds(@RequestParam String ids,
                                                                   @RequestParam(required = false) String shop) {
        List<Long> idList = Arrays.stream(ids.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(Long::parseLong)
                .collect(Collectors.toList());
        return ResponseEntity.ok(productService.getPublicProductsByIds(idList, shop));
    }

    @GetMapping("/{slug}")
    public ResponseEntity<ProductResponse> getProductBySlug(@PathVariable String slug,
                                                             @RequestParam(required = false) String shop) {
        return ResponseEntity.ok(productService.getProductBySlug(slug, shop));
    }
}
