package com.naturessence.catalog.controller;

import com.naturessence.catalog.service.CategoryService;
import com.naturessence.shared.dto.response.CategoryResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/public/categories")
@RequiredArgsConstructor
public class PublicCategoryController {

    private final CategoryService categoryService;

    @GetMapping("/menu")
    public ResponseEntity<List<CategoryResponse>> getMenuCategories(@RequestParam(required = false) String shop) {
        return ResponseEntity.ok(categoryService.getMenuCategories(shop));
    }

    @GetMapping
    public ResponseEntity<List<CategoryResponse>> getAllCategories(@RequestParam(required = false) String shop) {
        return ResponseEntity.ok(categoryService.getMenuCategories(shop));
    }

    @GetMapping("/homepage")
    public ResponseEntity<List<CategoryResponse>> getHomepageCategories(@RequestParam(required = false) String shop) {
        return ResponseEntity.ok(categoryService.getHomepageCategories(shop));
    }

    @GetMapping("/footer")
    public ResponseEntity<List<CategoryResponse>> getFooterCategories(@RequestParam(required = false) String shop) {
        return ResponseEntity.ok(categoryService.getFooterCategories(shop));
    }
}
