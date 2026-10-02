package com.naturessence.auth.controller;

import com.naturessence.shared.security.CurrentUser;
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

    /** Merchant sign-up, step 1: e-mails a six-digit code. The account exists only after /verify. */
    @PostMapping("/register-merchant")
    public ResponseEntity<Map<String, Object>> registerMerchant(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(authService.startMerchantSignup(request));
    }

    @PostMapping("/register-merchant/verify")
    public ResponseEntity<AuthResponse> verifyMerchant(@RequestBody Map<String, String> body) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(authService.verifyMerchantSignup(body.get("email"), body.get("code")));
    }

    @PostMapping("/register-merchant/resend")
    public ResponseEntity<Map<String, Object>> resendMerchantCode(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(authService.resendMerchantSignup(String.valueOf(body.get("email"))));
    }

    /** Sends a reset code if the account exists. {@code shopSlug} is set from a shop's storefront. */
    @PostMapping("/forgot-password")
    public ResponseEntity<MessageResponse> forgotPassword(@RequestBody Map<String, String> body) {
        authService.forgotPassword(body.get("email"), body.get("shopSlug"));
        return ResponseEntity.ok(new MessageResponse(
                "Si un compte existe pour cette adresse, un code de réinitialisation vient d'être envoyé."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<MessageResponse> resetPassword(@RequestBody Map<String, String> body) {
        authService.resetPassword(body.get("email"), body.get("code"), body.get("password"), body.get("shopSlug"));
        return ResponseEntity.ok(new MessageResponse("Mot de passe modifié. Vous pouvez vous connecter."));
    }

    /** Signed-in password change; required after signing in with a temporary password. */
    @PostMapping("/change-password")
    public ResponseEntity<AuthResponse> changePassword(Authentication authentication,
                                                       @RequestBody Map<String, String> body) {
        User user = currentUser(authentication);
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(authService.changePassword(user.getId(),
                body.get("currentPassword"), body.get("newPassword")));
    }

    @PostMapping("/my-shop")
    public ResponseEntity<UserResponse> createShop(Authentication authentication,
                                                    @Valid @RequestBody CreateShopRequest request) {
        Long userId = CurrentUser.id(authentication);
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.createShop(userId, request));
    }

    @GetMapping("/my-shop")
    public ResponseEntity<ShopPublicResponse> myShop(Authentication authentication) {
        Long userId = CurrentUser.id(authentication);
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(PublicShopController.toResponse(authService.myShop(userId)));
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
        Long userId = CurrentUser.id(authentication);
        return userId == null ? null : userRepository.findById(userId).orElse(null);
    }

    @PatchMapping("/my-shop")
    public ResponseEntity<UserResponse> updateShop(Authentication authentication,
                                                    @RequestBody CreateShopRequest request) {
        Long userId = CurrentUser.id(authentication);
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(authService.updateShop(userId, request));
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
        Long userId = CurrentUser.id(authentication);
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        authService.logout(userId);
        return ResponseEntity.ok(new MessageResponse("Déconnexion réussie"));
    }
}
