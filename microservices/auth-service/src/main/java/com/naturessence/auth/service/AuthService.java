package com.naturessence.auth.service;

import com.naturessence.auth.security.UserPrincipal;
import com.naturessence.shared.dto.request.CreateShopRequest;
import com.naturessence.shared.dto.request.LoginRequest;
import com.naturessence.shared.dto.request.RegisterRequest;
import com.naturessence.shared.dto.response.AuthResponse;
import com.naturessence.shared.dto.response.UserResponse;
import com.naturessence.shared.entity.RefreshToken;
import com.naturessence.shared.entity.Role;
import com.naturessence.shared.entity.Segment;
import com.naturessence.shared.entity.Shop;
import com.naturessence.shared.entity.User;
import com.naturessence.shared.enums.AccountStatus;
import com.naturessence.shared.repository.RoleRepository;
import com.naturessence.shared.repository.SegmentRepository;
import com.naturessence.shared.repository.ShopRepository;
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

import java.text.Normalizer;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final Set<String> LAYOUTS = Set.of("minimal", "bold", "luxury");

    private static final Set<String> RESERVED_SLUGS = Set.of(
            "login", "inscription", "auth-callback", "nouvelle-boutique", "sellio",
            "produits", "categories", "checkout", "confirmation", "profile",
            "commandes", "retours", "favoris", "recettes");

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final SegmentRepository segmentRepository;
    private final ShopRepository shopRepository;
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

        if (request.getShopSlug() != null && !request.getShopSlug().isBlank()) {
            Shop shop = shopRepository.findBySlug(request.getShopSlug().trim().toLowerCase())
                    .orElseThrow(() -> new IllegalArgumentException("Boutique introuvable"));
            user.setShopId(shop.getId());
        }

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
    public AuthResponse registerMerchant(RegisterRequest request) {
        if (userRepository.existsByEmailIgnoreCase(request.getEmail())) {
            throw new IllegalArgumentException("Cet email est déjà utilisé");
        }

        Role adminRole = roleRepository.findByName("ADMIN")
                .orElseThrow(() -> new RuntimeException("Rôle ADMIN non trouvé"));

        Segment nouveauSegment = segmentRepository.findByName("NOUVEAU")
                .orElseThrow(() -> new RuntimeException("Segment NOUVEAU non trouvé"));

        User user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail().toLowerCase().trim())
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .role(adminRole)
                .segment(nouveauSegment)
                .status(AccountStatus.ACTIVE)
                .build();

        user = userRepository.save(user);

        String accessToken = jwtUtil.generateAccessToken(user);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken.getToken())
                .user(mapToUserResponse(user))
                .build();
    }

    @Transactional
    public UserResponse createShop(String email, CreateShopRequest request) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé"));

        String role = user.getRole() != null ? user.getRole().getName() : "";
        if ("CLIENT".equals(role)) {
            throw new IllegalArgumentException("Un client ne peut pas ouvrir une boutique Sellio");
        }
        if ("SUPER_ADMIN".equals(role)) {
            throw new IllegalArgumentException("Le compte plateforme ne possède pas de boutique");
        }
        if (user.getShopId() != null) {
            throw new IllegalArgumentException("Ce compte a déjà une boutique");
        }

        String type = "CLOTHES".equalsIgnoreCase(request.getBusinessType()) ? "CLOTHES" : "COSMETICS";
        String template = layoutKey(request.getTemplateKey());

        String slug = uniqueSlug(request.getName());
        Shop shop = shopRepository.save(Shop.builder()
                .name(request.getName().trim())
                .slug(slug)
                .businessType(type)
                .templateKey(template)
                .logo(cleanLogo(request.getLogo()))
                .primaryColor(cleanHex(request.getPrimaryColor()))
                .buttonColor(cleanHex(request.getButtonColor()))
                .buttonTextColor(cleanHex(request.getButtonTextColor()))
                .accentColor(cleanHex(request.getAccentColor()))
                .backgroundColor(cleanHex(request.getBackgroundColor()))
                .textColor(cleanHex(request.getTextColor()))
                .ownerId(user.getId())
                .build());

        user.setShopId(shop.getId());
        userRepository.save(user);
        return mapToUserResponse(user);
    }

    @Transactional
    public UserResponse updateShop(String email, CreateShopRequest request) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé"));
        if (user.getShopId() == null) {
            throw new IllegalArgumentException("Ce compte n'a pas encore de boutique");
        }
        Shop shop = shopRepository.findById(user.getShopId())
                .orElseThrow(() -> new IllegalArgumentException("Boutique introuvable"));
        if (request.getTemplateKey() != null && !request.getTemplateKey().isBlank()) {
            shop.setTemplateKey(layoutKey(request.getTemplateKey()));
        }
        if (request.getLogo() != null) shop.setLogo(cleanLogo(request.getLogo()));
        if (request.getPrimaryColor() != null) shop.setPrimaryColor(cleanHex(request.getPrimaryColor()));
        if (request.getButtonColor() != null) shop.setButtonColor(cleanHex(request.getButtonColor()));
        if (request.getButtonTextColor() != null) shop.setButtonTextColor(cleanHex(request.getButtonTextColor()));
        if (request.getAccentColor() != null) shop.setAccentColor(cleanHex(request.getAccentColor()));
        if (request.getBackgroundColor() != null) shop.setBackgroundColor(cleanHex(request.getBackgroundColor()));
        if (request.getTextColor() != null) shop.setTextColor(cleanHex(request.getTextColor()));
        if (request.getCustomOptions() != null) {
            String options = request.getCustomOptions().trim();
            shop.setCustomOptions(options.isEmpty() || options.length() > 20000 ? null : options);
        }
        shopRepository.save(shop);
        return mapToUserResponse(user);
    }

    public Shop myShop(String email) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé"));
        if (user.getShopId() == null) {
            throw new IllegalArgumentException("Ce compte n'a pas encore de boutique");
        }
        return shopRepository.findById(user.getShopId())
                .orElseThrow(() -> new IllegalArgumentException("Boutique introuvable"));
    }

    private String layoutKey(String value) {
        String key = value == null ? "" : value.trim().toLowerCase();
        if (LAYOUTS.contains(key)) return key;
        if ("noir".equals(key) || "marin".equals(key)) return "bold";
        if ("atelier".equals(key) || "apothicaire".equals(key) || "botanique".equals(key)) return "luxury";
        return "minimal";
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
        Shop shop = user.getShopId() == null
                ? null
                : shopRepository.findById(user.getShopId()).orElse(null);
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
                .shopId(shop != null ? shop.getId() : null)
                .shopSlug(shop != null ? shop.getSlug() : null)
                .shopName(shop != null ? shop.getName() : null)
                .businessType(shop != null ? shop.getBusinessType() : null)
                .templateKey(shop != null ? shop.getTemplateKey() : null)
                .build();
    }

    private String uniqueSlug(String name) {
        String base = slugify(name);
        String slug = base;
        int n = 2;
        while (shopRepository.existsBySlug(slug)) {
            slug = base + "-" + n;
            n++;
        }
        return slug;
    }

    private String cleanHex(String value) {
        if (value == null) return null;
        String hex = value.trim();
        return hex.matches("#[0-9A-Fa-f]{6}") ? hex : null;
    }

    private String cleanLogo(String value) {
        if (value == null || value.isBlank()) return null;
        String logo = value.trim();
        if (logo.length() > 2_000_000) {
            throw new IllegalArgumentException("Le logo est trop volumineux (max 2 Mo).");
        }
        if (!logo.startsWith("data:image/") && !logo.startsWith("http://") && !logo.startsWith("https://")) {
            throw new IllegalArgumentException("Le logo doit être une image.");
        }
        return logo;
    }

    private String slugify(String name) {
        String slug = Normalizer.normalize(name == null ? "" : name, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-|-$)", "");
        if (slug.isBlank() || RESERVED_SLUGS.contains(slug)) {
            slug = "boutique";
        }
        return slug;
    }
}
