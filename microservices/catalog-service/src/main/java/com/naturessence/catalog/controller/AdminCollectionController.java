package com.naturessence.catalog.controller;

import com.naturessence.catalog.service.CollectionService;
import com.naturessence.shared.dto.request.CollectionRequest;
import com.naturessence.shared.dto.response.CollectionResponse;
import com.naturessence.shared.dto.response.MessageResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/collections")
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
@RequiredArgsConstructor
public class AdminCollectionController {

    private final CollectionService collectionService;

    @GetMapping
    public ResponseEntity<List<CollectionResponse>> getAllCollections() {
        return ResponseEntity.ok(collectionService.getAllCollections());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CollectionResponse> getCollectionById(@PathVariable Long id) {
        return ResponseEntity.ok(collectionService.getCollectionById(id));
    }

    @PostMapping
    public ResponseEntity<CollectionResponse> createCollection(@Valid @RequestBody CollectionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(collectionService.createCollection(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CollectionResponse> updateCollection(
            @PathVariable Long id,
            @Valid @RequestBody CollectionRequest request) {
        return ResponseEntity.ok(collectionService.updateCollection(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<MessageResponse> deleteCollection(@PathVariable Long id) {
        collectionService.deleteCollection(id);
        return ResponseEntity.ok(new MessageResponse("Collection supprimée avec succès"));
    }
}
