package com.ecommerce.controller;

import com.ecommerce.dto.response.CollectionResponse;
import com.ecommerce.service.CollectionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/public/collections")
@RequiredArgsConstructor
public class PublicCollectionController {

    private final CollectionService collectionService;

    @GetMapping("/menu")
    public ResponseEntity<List<CollectionResponse>> getMenuCollections() {
        return ResponseEntity.ok(collectionService.getMenuCollections());
    }

    @GetMapping("/homepage")
    public ResponseEntity<List<CollectionResponse>> getHomepageCollections() {
        return ResponseEntity.ok(collectionService.getHomepageCollections());
    }
}
