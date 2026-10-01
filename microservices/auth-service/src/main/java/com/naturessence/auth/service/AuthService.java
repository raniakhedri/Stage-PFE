package com.naturessence.auth.service;

import com.naturessence.auth.security.UserPrincipal;
import com.naturessence.shared.dto.request.CreateShopRequest;
import com.naturessence.shared.dto.request.LoginRequest;
import com.naturessence.shared.dto.request.MerchantVerificationRequest;
import com.naturessence.shared.dto.request.RegisterRequest;
import com.naturessence.shared.dto.response.AuthResponse;
import com.naturessence.shared.dto.response.UserResponse;
import com.naturessence.shared.entity.RefreshToken;
import com.naturessence.shared.entity.Role;
import com.naturessence.shared.entity.Segment;
import com.naturessence.shared.entity.Shop;
import com.naturessence.shared.entity.AuthCode;
import com.naturessence.shared.entity.User;
import com.naturessence.shared.enums.PermissionModule;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.naturessence.shared.enums.AccountStatus;
import com.naturessence.shared.repository.RoleRepository;
import com.naturessence.shared.repository.SegmentRepository;
import com.naturessence.shared.repository.ShopRepository;
import com.naturessence.shared.repository.UserRepository;
import com.naturessence.shared.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.LockedException;
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
    private final MerchantVerificationService verificationService;
    private final AuthCodeService authCodeService;
    private final EmailService emailService;

    private static final ObjectMapper JSON = new ObjectMapper();
    private static final int MIN_PASSWORD = 8;

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

        return issueTokens(user);
    }

    // ── Merchant sign-up, confirmed by an e-mailed code ──────────────────────

    /** Step 1: checks the form, keeps it (password hashed) and e-mails a six-digit code. Nothing is created yet. */
    @Transactional
    public Map<String, Object> startMerchantSignup(RegisterRequest request) {
        String email = request.getEmail().toLowerCase().trim();
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new IllegalArgumentException("Cet email est déjà utilisé");
        }
        requireStrongPassword(request.getPassword());
        Map<String, String> pending = new HashMap<>();
        pending.put("firstName", request.getFirstName());
        pending.put("lastName", request.getLastName());
        pending.put("phone", request.getPhone());
        pending.put("passwordHash", passwordEncoder.encode(request.getPassword()));
        String code;
        try {
            code = authCodeService.issue(email, AuthCode.SIGNUP, JSON.writeValueAsString(pending));
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            throw new IllegalStateException(e);
        }
        emailService.sendSignupCode(email, request.getFirstName(), code);
        return Map.of("email", email, "otpRequired", true);
    }

    /** Sends a new code for a pending sign-up (same data). */
    @Transactional
    public Map<String, Object> resendMerchantSignup(String email) {
        AuthCode pending = authCodeService.pending(email, AuthCode.SIGNUP);
        String code = authCodeService.issue(email, AuthCode.SIGNUP, pending.getPayload());
        String firstName = "";
        try {
            firstName = String.valueOf(JSON.readValue(pending.getPayload(), Map.class).get("firstName"));
        } catch (Exception ignored) {
            // the greeting is cosmetic
        }
        emailService.sendSignupCode(email.trim().toLowerCase(), firstName, code);
        return Map.of("email", email.trim().toLowerCase(), "otpRequired", true);
    }

    /** Step 2: the code is right, the merchant account is created and signed in. */
    @Transactional(noRollbackFor = IllegalArgumentException.class)
    @SuppressWarnings("unchecked")
    public AuthResponse verifyMerchantSignup(String email, String code) {
        String key = email == null ? "" : email.toLowerCase().trim();
        if (userRepository.existsByEmailIgnoreCase(key)) {
            throw new IllegalArgumentException("Cet email est déjà utilisé");
        }
        AuthCode entry = authCodeService.consume(key, AuthCode.SIGNUP, code);
        Map<String, String> pending;
        try {
            pending = JSON.readValue(entry.getPayload(), Map.class);
        } catch (Exception e) {
            throw new IllegalArgumentException("Inscription introuvable. Recommencez.");
        }

        Role adminRole = roleRepository.findByName("ADMIN")
                .orElseThrow(() -> new RuntimeException("Rôle ADMIN non trouvé"));

        Segment nouveauSegment = segmentRepository.findByName("NOUVEAU")
                .orElseThrow(() -> new RuntimeException("Segment NOUVEAU non trouvé"));

        User user = User.builder()
                .firstName(pending.get("firstName"))
                .lastName(pending.get("lastName"))
                .email(key)
                .password(pending.get("passwordHash"))
                .phone(pending.get("phone"))
                .role(adminRole)
                .segment(nouveauSegment)
                .status(AccountStatus.ACTIVE)
                .build();

        user = userRepository.save(user);
        return issueTokens(user);
    }

    // ── Passwords ────────────────────────────────────────────────────────────

    /**
     * Forgot password, for merchants and for a shop's customers. Always answers the same way so the
     * form cannot be used to find out which e-mails have an account.
     */
    @Transactional
    public void forgotPassword(String email, String shopSlug) {
        String key = email == null ? "" : email.toLowerCase().trim();
        User user = userRepository.findByEmailIgnoreCase(key).orElse(null);
        if (user == null || user.getStatus() == AccountStatus.BLOCKED) return;
        Shop shop = null;
        if (shopSlug != null && !shopSlug.isBlank()) {
            shop = shopRepository.findBySlug(shopSlug.trim().toLowerCase()).orElse(null);
            // A shop's page only resets that shop's customer accounts.
            if (shop == null || !shop.getId().equals(user.getShopId())) return;
        }
        String code;
        try {
            code = authCodeService.issue(key, AuthCode.RESET, null);
        } catch (IllegalArgumentException tooSoon) {
            return; // a code was sent less than a minute ago; answer as usual
        }
        emailService.sendPasswordResetCode(user, code, shop != null ? shop.getName() : null);
    }

    @Transactional(noRollbackFor = IllegalArgumentException.class)
    public void resetPassword(String email, String code, String newPassword) {
        requireStrongPassword(newPassword);
        String key = email == null ? "" : email.toLowerCase().trim();
        authCodeService.consume(key, AuthCode.RESET, code);
        User user = userRepository.findByEmailIgnoreCase(key)
                .orElseThrow(() -> new IllegalArgumentException("Code invalide ou expiré."));
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setMustChangePassword(false);
        userRepository.save(user);
        refreshTokenService.deleteByUserId(user.getId());
    }

    /** Signed-in password change; also clears the "temporary password" flag. Returns fresh tokens. */
    @Transactional
    public AuthResponse changePassword(String email, String currentPassword, String newPassword) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé"));
        if (currentPassword == null || !passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new IllegalArgumentException("Le mot de passe actuel est incorrect.");
        }
        requireStrongPassword(newPassword);
        if (passwordEncoder.matches(newPassword, user.getPassword())) {
            throw new IllegalArgumentException("Choisissez un mot de passe différent de l'actuel.");
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setMustChangePassword(false);
        userRepository.save(user);
        refreshTokenService.deleteByUserId(user.getId());
        return issueTokens(user);
    }

    private void requireStrongPassword(String password) {
        if (password == null || password.length() < MIN_PASSWORD) {
            throw new IllegalArgumentException("Le mot de passe doit contenir au moins " + MIN_PASSWORD + " caractères.");
        }
    }

    /** Access + refresh tokens; the access token carries the shop so every service can scope requests. */
    public AuthResponse issueTokens(User user) {
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);
        return AuthResponse.builder()
                .accessToken(jwtUtil.generateAccessToken(user, shopSlugOf(user)))
                .refreshToken(refreshToken.getToken())
                .user(mapToUserResponse(user))
                .build();
    }

    private String shopSlugOf(User user) {
        if (user.getShopId() == null) return null;
        return shopRepository.findById(user.getShopId()).map(Shop::getSlug).orElse(null);
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

        MerchantVerificationRequest verification = verificationService.requireComplete(request.getVerification());

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
                .theme(cleanTheme(request.getTheme()))
                .status(Shop.PENDING)
                .ownerId(user.getId())
                .build());

        user.setShopId(shop.getId());
        userRepository.save(user);
        verificationService.submit(user.getId(), shop.getId(), verification);
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
        if (request.getTheme() != null) shop.setTheme(cleanTheme(request.getTheme()));
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
                throw new LockedException("Votre compte a été bloqué. Contactez l'équipe Sellio.");
            }
            if (user.getStatus() == AccountStatus.INACTIVE) {
                throw new LockedException("Votre accès a été désactivé. Contactez le responsable de la boutique.");
            }

            user.setLastLogin(LocalDateTime.now());
            userRepository.save(user);

            return issueTokens(user);

        } catch (BadCredentialsException e) {
            throw new BadCredentialsException("Email ou mot de passe incorrect");
        }
    }

    @Transactional
    public AuthResponse refreshToken(String token) {
        RefreshToken refreshToken = refreshTokenService.verifyRefreshToken(token);
        User user = refreshToken.getUser();

        if (user.getStatus() == AccountStatus.BLOCKED || user.getStatus() == AccountStatus.INACTIVE) {
            throw new LockedException("Votre accès a été désactivé.");
        }

        return AuthResponse.builder()
                .accessToken(jwtUtil.generateAccessToken(user, shopSlugOf(user)))
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
        String roleName = user.getRole() != null ? user.getRole().getName() : "";
        boolean staff = user.getRole() != null && user.getRole().getShopId() != null;
        if ("ADMIN".equals(roleName) || "SUPER_ADMIN".equals(roleName)) {
            // The merchant owns the shop: every page of their backoffice is theirs.
            for (PermissionModule module : PermissionModule.values()) permissionsMap.put(module.name(), true);
        } else if (user.getRole() != null && user.getRole().getPermissions() != null) {
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
                .shopStatus(shop != null ? Shop.statusOf(shop) : null)
                .roleId(user.getRole() != null ? user.getRole().getId() : null)
                .staff(staff)
                .shopOwner(shop != null && user.getId().equals(shop.getOwnerId()))
                .mustChangePassword(Boolean.TRUE.equals(user.getMustChangePassword()))
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

    /** Theme is a flat JSON object of colour keys; keep it small and only allow hex values. */
    private String cleanTheme(String value) {
        if (value == null) return null;
        String theme = value.trim();
        if (theme.isEmpty() || "{}".equals(theme)) return null;
        if (theme.length() > 4000 || !theme.startsWith("{") || !theme.endsWith("}")) {
            throw new IllegalArgumentException("Thème invalide.");
        }
        if (!theme.replaceAll("\"[A-Za-z]+\"\\s*:\\s*\"#[0-9A-Fa-f]{6}\"", "").replaceAll("[\\s,{}]", "").isEmpty()) {
            throw new IllegalArgumentException("Le thème ne peut contenir que des couleurs #RRGGBB.");
        }
        return theme;
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
