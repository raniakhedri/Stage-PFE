package com.ecommerce.controller;

import com.ecommerce.dto.request.ReturnRequestDTO;
import com.ecommerce.dto.request.ReviewRequest;
import com.ecommerce.dto.request.UpdateProfileRequest;
import com.ecommerce.dto.response.LoyaltyInfoResponse;
import com.ecommerce.dto.response.OrderResponse;
import com.ecommerce.dto.response.ReturnResponse;
import com.ecommerce.dto.response.ReviewResponse;
import com.ecommerce.dto.response.UserResponse;
import com.ecommerce.security.UserPrincipal;
import com.ecommerce.service.LoyaltyService;
import com.ecommerce.service.OrderService;
import com.ecommerce.service.ReturnService;
import com.ecommerce.service.ReviewService;
import com.ecommerce.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final UserService userService;
    private final OrderService orderService;
    private final ReviewService reviewService;
    private final ReturnService returnService;
    private final LoyaltyService loyaltyService;

    @GetMapping
    public ResponseEntity<UserResponse> getProfile(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(userService.getProfile(principal.getId()));
    }

    @PutMapping
    public ResponseEntity<UserResponse> updateProfile(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(userService.updateProfile(principal.getId(), request));
    }

    @GetMapping("/orders")
    public ResponseEntity<List<OrderResponse>> getMyOrders(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(orderService.getOrdersByEmail(principal.getUsername()));
    }

    @PostMapping("/reviews")
    public ResponseEntity<ReviewResponse> submitReview(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ReviewRequest request) {
        return ResponseEntity.ok(reviewService.createReview(principal.getId(), request));
    }

    @GetMapping("/reviews")
    public ResponseEntity<List<ReviewResponse>> getMyReviews(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(reviewService.getReviewsByUser(principal.getId()));
    }

    @PostMapping("/returns")
    public ResponseEntity<ReturnResponse> submitReturn(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ReturnRequestDTO request) {
        return ResponseEntity.ok(returnService.createReturn(principal.getUsername(), request));
    }

    @GetMapping("/returns")
    public ResponseEntity<List<ReturnResponse>> getMyReturns(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(returnService.getMyReturns(principal.getUsername()));
    }

    @GetMapping("/loyalty")
    public ResponseEntity<LoyaltyInfoResponse> getMyLoyalty(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(loyaltyService.getLoyaltyInfo(principal.getId()));
    }
}
