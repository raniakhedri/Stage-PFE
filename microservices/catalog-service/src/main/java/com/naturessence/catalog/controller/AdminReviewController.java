package com.naturessence.catalog.controller;

import com.naturessence.catalog.service.ReviewService;
import com.naturessence.shared.dto.response.ReviewResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/reviews")
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
@RequiredArgsConstructor
public class AdminReviewController {

    private final ReviewService reviewService;

    @GetMapping
    public ResponseEntity<List<ReviewResponse>> getAllReviews() {
        return ResponseEntity.ok(reviewService.getAllReviews());
    }

    @PatchMapping("/{id}/statut")
    public ResponseEntity<ReviewResponse> updateStatut(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(reviewService.updateStatut(id, body.get("statut")));
    }

    @PatchMapping("/{id}/reponse")
    public ResponseEntity<ReviewResponse> replyToReview(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(reviewService.replyToReview(id, body.get("reponse")));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReview(@PathVariable Long id) {
        reviewService.deleteReview(id);
        return ResponseEntity.noContent().build();
    }
}
