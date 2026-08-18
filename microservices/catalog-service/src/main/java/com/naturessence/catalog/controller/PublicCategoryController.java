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
    public ResponseEntity<List<CategoryResponse>> getMenuCategories() {
        return ResponseEntity.ok(categoryService.getMenuCategories());
    }

    @GetMapping
    public ResponseEntity<List<CategoryResponse>> getAllCategories() {
        return ResponseEntity.ok(categoryService.getMenuCategories());
    }

    @GetMapping("/homepage")
    public ResponseEntity<List<CategoryResponse>> getHomepageCategories() {
        return ResponseEntity.ok(categoryService.getHomepageCategories());
    }

    @GetMapping("/footer")
    public ResponseEntity<List<CategoryResponse>> getFooterCategories() {
        return ResponseEntity.ok(categoryService.getFooterCategories());
    }
}
