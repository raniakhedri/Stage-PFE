package com.naturessence.auth.controller;

import com.naturessence.auth.service.AuthService;
import com.naturessence.auth.service.MerchantVerificationService;
import com.naturessence.shared.dto.request.MerchantVerificationRequest;
import com.naturessence.shared.entity.User;
import java.util.Map;
import com.naturessence.shared.dto.request.CreateShopRequest;
import com.naturessence.shared.dto.request.LoginRequest;
import com.naturessence.shared.dto.request.RefreshTokenRequest;
import com.naturessence.shared.dto.request.RegisterRequest;
import com.naturessence.shared.dto.response.AuthResponse;
import com.naturessence.shared.dto.response.MessageResponse;
import com.naturessence.shared.dto.response.ShopPublicResponse;
import com.naturessence.shared.dto.response.UserResponse;
import com.naturessence.shared.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;
    private final MerchantVerificationService verificationService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @PostMapping("/register-merchant")
    public ResponseEntity<AuthResponse> registerMerchant(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.registerMerchant(request));
    }

    @PostMapping("/my-shop")
    public ResponseEntity<UserResponse> createShop(Authentication authentication,
                                                    @Valid @RequestBody CreateShopRequest request) {
        if (authentication == null || !authentication.isAuthenticated()
                || authentication.getName() == null
                || "anonymousUser".equals(authentication.getName())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.createShop(authentication.getName(), request));
    }

    @GetMapping("/my-shop")
    public ResponseEntity<ShopPublicResponse> myShop(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()
                || authentication.getName() == null
                || "anonymousUser".equals(authentication.getName())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(PublicShopController.toResponse(authService.myShop(authentication.getName())));
    }

    /** Current session user, re-read from the database (shop status changes after admin review). */
    @GetMapping("/me")
    public ResponseEntity<UserResponse> me(Authentication authentication) {
        User user = currentUser(authentication);
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(authService.mapToUserResponse(user));
    }

    @GetMapping("/my-shop/verification")
    public ResponseEntity<Map<String, Object>> verificationStatus(Authentication authentication) {
        User user = currentUser(authentication);
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(verificationService.statusFor(user));
    }

    @PutMapping("/my-shop/verification")
    public ResponseEntity<Map<String, Object>> resubmitVerification(Authentication authentication,
                                                                    @RequestBody MerchantVerificationRequest request) {
        User user = currentUser(authentication);
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(verificationService.resubmit(user, request));
    }

    private User currentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()
                || authentication.getName() == null
                || "anonymousUser".equals(authentication.getName())) {
            return null;
        }
        return userRepository.findByEmailIgnoreCase(authentication.getName()).orElse(null);
    }

    @PatchMapping("/my-shop")
    public ResponseEntity<UserResponse> updateShop(Authentication authentication,
                                                    @RequestBody CreateShopRequest request) {
        if (authentication == null || !authentication.isAuthenticated()
                || authentication.getName() == null
                || "anonymousUser".equals(authentication.getName())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(authService.updateShop(authentication.getName(), request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        return ResponseEntity.ok(authService.refreshToken(request.getRefreshToken()));
    }

    @PostMapping("/logout")
    public ResponseEntity<MessageResponse> logout(Authentication authentication) {
        String email = authentication.getName();
        Long userId = userRepository.findByEmailIgnoreCase(email)
                .map(u -> u.getId())
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        authService.logout(userId);
        return ResponseEntity.ok(new MessageResponse("Déconnexion réussie"));
    }
}
