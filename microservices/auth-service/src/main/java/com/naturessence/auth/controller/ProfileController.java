package com.naturessence.auth.controller;

import com.naturessence.shared.security.CurrentUser;
import com.naturessence.auth.service.LoyaltyService;
import com.naturessence.auth.service.UserService;
import com.naturessence.shared.dto.request.UpdateProfileRequest;
import com.naturessence.shared.dto.response.LoyaltyInfoResponse;
import com.naturessence.shared.dto.response.UserResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final UserService userService;
    private final LoyaltyService loyaltyService;

    @GetMapping
    public ResponseEntity<UserResponse> getProfile(Authentication authentication) {
        return ResponseEntity.ok(userService.getProfile(requireUser(authentication)));
    }

    @PutMapping
    public ResponseEntity<UserResponse> updateProfile(
            Authentication authentication,
            @Valid @RequestBody UpdateProfileRequest request) {
        Long userId = requireUser(authentication);
        return ResponseEntity.ok(userService.updateProfile(userId, request));
    }

    @GetMapping("/loyalty")
    public ResponseEntity<LoyaltyInfoResponse> getMyLoyalty(Authentication authentication) {
        Long userId = requireUser(authentication);
        return ResponseEntity.ok(loyaltyService.getLoyaltyInfo(userId));
    }

    @GetMapping("/cart")
    public ResponseEntity<String> getCart(Authentication authentication) {
        Long userId = requireUser(authentication);
        return ResponseEntity.ok(userService.getCart(userId));
    }

    @PutMapping("/cart")
    public ResponseEntity<Void> saveCart(
            Authentication authentication,
            @RequestBody String cartJson) {
        Long userId = requireUser(authentication);
        userService.saveCart(userId, cartJson);
        return ResponseEntity.noContent().build();
    }

    private static Long requireUser(Authentication authentication) {
        Long userId = CurrentUser.id(authentication);
        if (userId == null) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.UNAUTHORIZED, "Connexion requise");
        }
        return userId;
    }
}
