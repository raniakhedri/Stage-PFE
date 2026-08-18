package com.naturessence.auth.service;

import com.naturessence.auth.security.UserPrincipal;
import com.naturessence.shared.dto.request.LoginRequest;
import com.naturessence.shared.dto.request.RegisterRequest;
import com.naturessence.shared.dto.response.AuthResponse;
import com.naturessence.shared.dto.response.UserResponse;
import com.naturessence.shared.entity.RefreshToken;
import com.naturessence.shared.entity.Role;
import com.naturessence.shared.entity.Segment;
import com.naturessence.shared.entity.User;
import com.naturessence.shared.enums.AccountStatus;
import com.naturessence.shared.repository.RoleRepository;
import com.naturessence.shared.repository.SegmentRepository;
import com.naturessence.shared.repository.UserRepository;
import com.naturessence.shared.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final SegmentRepository segmentRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final RefreshTokenService refreshTokenService;
    private final LoyaltyService loyaltyService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmailIgnoreCase(request.getEmail())) {
            throw new IllegalArgumentException("Cet email est déjà utilisé");
        }

        Role clientRole = roleRepository.findByName("CLIENT")
                .orElseThrow(() -> new RuntimeException("Rôle CLIENT non trouvé"));

        Segment nouveauSegment = segmentRepository.findByName("NOUVEAU")
                .orElseThrow(() -> new RuntimeException("Segment NOUVEAU non trouvé"));

        User user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail().toLowerCase().trim())
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .dateOfBirth(request.getDateOfBirth())
                .gender(request.getGender())
                .role(clientRole)
                .segment(nouveauSegment)
                .status(AccountStatus.ACTIVE)
                .build();

        user = userRepository.save(user);

        try {
            loyaltyService.awardWelcomePoints(user);
        } catch (Exception ignored) {
            // LoyaltyConfig may be absent — registration must not fail because of it
        }

        String accessToken = jwtUtil.generateAccessToken(user);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken.getToken())
                .user(mapToUserResponse(user))
                .build();
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail().toLowerCase().trim(),
                            request.getPassword()));

            UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();

            User user = userRepository.findByEmailIgnoreCase(principal.getEmail())
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            if (user.getStatus() == AccountStatus.BLOCKED) {
                throw new RuntimeException("Votre compte a été bloqué. Contactez l'administrateur.");
            }

            user.setLastLogin(LocalDateTime.now());
            userRepository.save(user);

            String accessToken = jwtUtil.generateAccessToken(user);
            RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);

            return AuthResponse.builder()
                    .accessToken(accessToken)
                    .refreshToken(refreshToken.getToken())
                    .user(mapToUserResponse(user))
                    .build();

        } catch (BadCredentialsException e) {
            throw new BadCredentialsException("Email ou mot de passe incorrect");
        }
    }

    @Transactional
    public AuthResponse refreshToken(String token) {
        RefreshToken refreshToken = refreshTokenService.verifyRefreshToken(token);
        User user = refreshToken.getUser();

        String accessToken = jwtUtil.generateAccessToken(user);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken.getToken())
                .user(mapToUserResponse(user))
                .build();
    }

    @Transactional
    public void logout(Long userId) {
        refreshTokenService.deleteByUserId(userId);
    }

    public UserResponse mapToUserResponse(User user) {
        Map<String, Boolean> permissionsMap = new HashMap<>();
        if (user.getRole() != null && user.getRole().getPermissions() != null) {
            user.getRole().getPermissions()
                    .forEach(p -> permissionsMap.put(p.getModule().name(), p.isGranted()));
        }
        return UserResponse.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .dateOfBirth(user.getDateOfBirth())
                .gender(user.getGender())
                .address(user.getAddress())
                .city(user.getCity())
                .postalCode(user.getPostalCode())
                .gouvernorat(user.getGouvernorat())
                .country(user.getCountry())
                .status(user.getStatus())
                .segmentName(user.getSegment() != null ? user.getSegment().getName() : null)
                .segmentLabel(user.getSegment() != null ? user.getSegment().getLabel() : null)
                .roleName(user.getRole().getName())
                .roleLabel(user.getRole().getLabel())
                .note(user.getNote())
                .loyaltyPoints(user.getLoyaltyPoints() != null ? user.getLoyaltyPoints() : 0)
                .lastLogin(user.getLastLogin())
                .createdAt(user.getCreatedAt())
                .permissions(permissionsMap)
                .build();
    }
}
