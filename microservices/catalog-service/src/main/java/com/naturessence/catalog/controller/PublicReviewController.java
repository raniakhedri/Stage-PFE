package com.naturessence.catalog.controller;

import com.naturessence.shared.security.CurrentUser;
import com.naturessence.catalog.service.ReviewService;
import com.naturessence.shared.dto.request.ReviewRequest;
import com.naturessence.shared.dto.response.ReviewResponse;
import com.naturessence.shared.entity.User;
import com.naturessence.shared.repository.UserRepository;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class PublicReviewController {

    private final ReviewService reviewService;
    private final UserRepository userRepository;

    // ── Public: Approved reviews for a product ─────────────────────────
    @GetMapping("/api/v1/public/reviews/product/{productId}")
    public ResponseEntity<List<ReviewResponse>> getByProduct(
        @PathVariable Long productId
    ) {
        return ResponseEntity.ok(
            reviewService.getApprovedReviewsByProduct(productId)
        );
    }

    // ── Authenticated: Submit a review ─────────────────────────────────
    // Requires a valid JWT. The principal name is the user's id (set by JwtAuthenticationFilter).
    @PostMapping({ "/api/v1/reviews", "/api/v1/profile/reviews" })
    public ResponseEntity<ReviewResponse> submitReview(
        Authentication authentication,
        @Valid @RequestBody ReviewRequest request
    ) {
        Long userId = CurrentUser.id(authentication);
        User user = (userId == null ? java.util.Optional.<User>empty() : userRepository.findById(userId))
            .orElseThrow(() ->
                new IllegalArgumentException("Utilisateur introuvable")
            );
        return ResponseEntity.ok(
            reviewService.createReview(user.getId(), request)
        );
    }

    // ── Authenticated: Get my reviews ───────────────────────────────────
    @GetMapping({ "/api/v1/reviews/my", "/api/v1/profile/reviews" })
    public ResponseEntity<List<ReviewResponse>> getMyReviews(
        Authentication authentication
    ) {
        Long userId = CurrentUser.id(authentication);
        User user = (userId == null ? java.util.Optional.<User>empty() : userRepository.findById(userId))
            .orElseThrow(() ->
                new IllegalArgumentException("Utilisateur introuvable")
            );
        return ResponseEntity.ok(reviewService.getReviewsByUser(user.getId()));
    }

    // ── Authenticated: Check if a product in an order is already reviewed ──
    @GetMapping("/api/v1/reviews/has-reviewed")
    public ResponseEntity<Boolean> hasReviewed(
        @RequestParam Long orderId,
        @RequestParam Long productId
    ) {
        return ResponseEntity.ok(reviewService.hasReviewed(orderId, productId));
    }
}
