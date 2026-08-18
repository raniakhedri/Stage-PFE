package com.naturessence.auth.controller;

import com.naturessence.auth.service.AuthService;
import com.naturessence.shared.dto.request.LoginRequest;
import com.naturessence.shared.dto.request.RefreshTokenRequest;
import com.naturessence.shared.dto.request.RegisterRequest;
import com.naturessence.shared.dto.response.AuthResponse;
import com.naturessence.shared.dto.response.MessageResponse;
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

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
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
