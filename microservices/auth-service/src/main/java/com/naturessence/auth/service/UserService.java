package com.naturessence.auth.service;

import com.naturessence.shared.dto.request.CreateUserRequest;
import com.naturessence.shared.dto.request.UpdateProfileRequest;
import com.naturessence.shared.dto.request.UpdateUserRequest;
import com.naturessence.shared.dto.response.DashboardStatsResponse;
import com.naturessence.shared.dto.response.UserResponse;
import com.naturessence.shared.entity.Role;
import com.naturessence.shared.entity.Segment;
import com.naturessence.shared.entity.User;
import com.naturessence.shared.entity.Order;
import com.naturessence.shared.enums.AccountStatus;
import com.naturessence.shared.repository.CouponUsageRepository;
import com.naturessence.shared.repository.OrderRepository;
import com.naturessence.shared.repository.PointsTransactionRepository;
import com.naturessence.shared.repository.RefreshTokenRepository;
import com.naturessence.shared.repository.ReviewRepository;
import com.naturessence.shared.repository.RoleRepository;
import com.naturessence.shared.entity.Shop;
import com.naturessence.shared.repository.SegmentRepository;
import com.naturessence.shared.repository.ShopRepository;
import com.naturessence.shared.repository.UserRepository;

import com.naturessence.auth.security.CallerContext;
import java.security.SecureRandom;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final ShopRepository shopRepository;
    private final RoleRepository roleRepository;
    private final SegmentRepository segmentRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthService authService;
    private final RefreshTokenRepository refreshTokenRepository;
    private final CouponUsageRepository couponUsageRepository;
    private final EmailService emailService;
    private final PointsTransactionRepository pointsTransactionRepository;
    private final ReviewRepository reviewRepository;
    private final OrderRepository orderRepository;
    private final CallerContext caller;
    private final RoleService roleService;

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String PASSWORD_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";


    // ── Admin: Create user ────────────────────────────────────────────────────
    @Transactional
    public UserResponse createUser(CreateUserRequest request) {
        if (userRepository.existsByEmailIgnoreCase(request.getEmail())) {
            throw new IllegalArgumentException("Cet email est déjà utilisé");
        }
        User me = caller.require();
        boolean platform = CallerContext.isPlatformAdmin(me);

        String roleName = request.getRole() == null || request.getRole().isBlank()
                ? "CLIENT" : request.getRole().toUpperCase().trim();
        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new IllegalArgumentException("Rôle non trouvé: " + request.getRole()));
        if (!platform && !"CLIENT".equals(role.getName())
                && (role.getShopId() == null || !role.getShopId().equals(me.getShopId()))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Vous ne pouvez attribuer que les rôles de votre boutique");
        }

        Segment segment;
        if (request.getSegment() != null && !request.getSegment().isBlank()) {
            segment = segmentRepository.findByName(request.getSegment().toUpperCase().trim())
                    .orElseThrow(() -> new RuntimeException("Segment non trouvé: " + request.getSegment()));
        } else {
            segment = segmentRepository.findByName("NOUVEAU")
                    .orElseThrow(() -> new RuntimeException("Segment par défaut NOUVEAU introuvable"));
        }

        // Accounts created from the backoffice always get a one-time password by e-mail.
        String rawTempPassword = temporaryPassword();
        String encodedPassword = passwordEncoder.encode(rawTempPassword);

        User user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail().toLowerCase().trim())
                .password(encodedPassword)
                .phone(request.getPhone())
                .dateOfBirth(request.getDateOfBirth())
                .gender(request.getGender())
                .address(request.getAddress())
                .city(request.getCity())
                .postalCode(request.getPostalCode())
                .country(request.getCountry())
                .role(role)
                .segment(segment)
                .note(request.getNote())
                .status(AccountStatus.ACTIVE)
                .mustChangePassword(true)
                .shopId(platform ? null : me.getShopId())
                .build();

        user = userRepository.save(user);
        sendInvite(user, rawTempPassword, role.getShopId() != null);
        return authService.mapToUserResponse(user);
    }

    // ── Team (merchant's staff) ───────────────────────────────────────────────

    /** Owner and team members of the caller's shop. */
    @Transactional(readOnly = true)
    public List<UserResponse> getTeam() {
        User me = caller.require();
        Long shopId = caller.requireShopId(me);
        return userRepository.findTeamByShopId(shopId).stream().map(authService::mapToUserResponse).toList();
    }

    /** Adds a team member with one of the shop's roles and e-mails a one-time password. */
    @Transactional
    public UserResponse inviteTeamMember(String firstName, String lastName, String email, String phone, Long roleId) {
        User me = caller.require();
        Long shopId = caller.requireShopId(me);
        if (email == null || email.isBlank() || firstName == null || firstName.isBlank()) {
            throw new IllegalArgumentException("Prénom et e-mail sont obligatoires");
        }
        if (userRepository.existsByEmailIgnoreCase(email.trim())) {
            throw new IllegalArgumentException("Cet email est déjà utilisé");
        }
        if (roleId == null) throw new IllegalArgumentException("Choisissez un rôle");
        Role role = roleService.ownedRole(me, roleId);
        Segment segment = segmentRepository.findByName("NOUVEAU").orElse(null);

        String rawTempPassword = temporaryPassword();
        User member = userRepository.save(User.builder()
                .firstName(firstName.trim())
                .lastName(lastName == null ? "" : lastName.trim())
                .email(email.toLowerCase().trim())
                .phone(phone)
                .password(passwordEncoder.encode(rawTempPassword))
                .role(role)
                .segment(segment)
                .status(AccountStatus.ACTIVE)
                .mustChangePassword(true)
                .shopId(shopId)
                .build());
        sendInvite(member, rawTempPassword, true);
        return authService.mapToUserResponse(member);
    }

    /** Gives a team member another role of the shop; their pages change at their next sign-in. */
    @Transactional
    public UserResponse changeTeamRole(Long userId, Long roleId) {
        User me = caller.require();
        User member = teamMemberOf(me, userId);
        member.setRole(roleService.ownedRole(me, roleId));
        refreshTokenRepository.deleteByUserId(member.getId()); // forces a fresh token with the new permissions
        return authService.mapToUserResponse(userRepository.save(member));
    }

    /** New one-time password for a team member who lost the invitation. */
    @Transactional
    public void resendTeamInvite(Long userId) {
        User me = caller.require();
        User member = teamMemberOf(me, userId);
        String rawTempPassword = temporaryPassword();
        member.setPassword(passwordEncoder.encode(rawTempPassword));
        member.setMustChangePassword(true);
        userRepository.save(member);
        sendInvite(member, rawTempPassword, true);
    }

    @Transactional
    public void removeTeamMember(Long userId) {
        User me = caller.require();
        User member = teamMemberOf(me, userId);
        deleteUser(member.getId());
    }

    /** A team member (not the owner, not the caller, not a customer) of the caller's shop. */
    private User teamMemberOf(User me, Long userId) {
        Long shopId = caller.requireShopId(me);
        User member = findUserOrThrow(userId);
        if (!shopId.equals(member.getShopId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Membre introuvable");
        }
        if (member.getRole() == null || member.getRole().getShopId() == null) {
            throw new IllegalArgumentException("Seuls les membres ajoutés à l'équipe peuvent être modifiés ici");
        }
        if (member.getId().equals(me.getId())) {
            throw new IllegalArgumentException("Vous ne pouvez pas modifier votre propre accès");
        }
        return member;
    }

    private void sendInvite(User user, String rawTempPassword, boolean teamMember) {
        Shop shop = user.getShopId() == null ? null : shopRepository.findById(user.getShopId()).orElse(null);
        emailService.sendAccountInvite(user, rawTempPassword,
                shop != null ? shop.getName() : null, shop != null ? shop.getSlug() : null, teamMember);
    }

    private static String temporaryPassword() {
        StringBuilder sb = new StringBuilder("Tmp-");
        for (int i = 0; i < 8; i++) sb.append(PASSWORD_CHARS.charAt(RANDOM.nextInt(PASSWORD_CHARS.length())));
        return sb.toString();
    }

    /** Merchants and team members only reach accounts of their own shop. */
    private User accessibleUser(Long id) {
        User me = caller.require();
        User target = findUserOrThrow(id);
        if (CallerContext.isPlatformAdmin(me)) return target;
        if (me.getShopId() == null || !me.getShopId().equals(target.getShopId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilisateur introuvable");
        }
        return target;
    }

    // ── Admin: Update user ────────────────────────────────────────────────────
    @Transactional
    public UserResponse updateUser(Long id, UpdateUserRequest request) {
        User user = accessibleUser(id);
        boolean platform = CallerContext.isPlatformAdmin(caller.require());

        if (request.getFirstName() != null) user.setFirstName(request.getFirstName());
        if (request.getLastName() != null) user.setLastName(request.getLastName());
        if (request.getEmail() != null && !request.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmailIgnoreCase(request.getEmail())) {
                throw new IllegalArgumentException("Cet email est déjà utilisé");
            }
            user.setEmail(request.getEmail().toLowerCase().trim());
        }
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        if (request.getDateOfBirth() != null) user.setDateOfBirth(request.getDateOfBirth());
        if (request.getGender() != null) user.setGender(request.getGender());
        if (request.getAddress() != null) user.setAddress(request.getAddress());
        if (request.getCity() != null) user.setCity(request.getCity());
        if (request.getPostalCode() != null) user.setPostalCode(request.getPostalCode());
        if (request.getCountry() != null) user.setCountry(request.getCountry());
        if (request.getStatus() != null) user.setStatus(request.getStatus());
        if (request.getSegment() != null) {
            Segment segment = segmentRepository.findByName(request.getSegment().toUpperCase().trim())
                    .orElseThrow(() -> new RuntimeException("Segment non trouvé: " + request.getSegment()));
            user.setSegment(segment);
        }
        if (request.getRole() != null && !platform
                && !request.getRole().equalsIgnoreCase(user.getRole().getName())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Le rôle d'un membre se change depuis « Rôles & Permissions »");
        }
        if (request.getRole() != null && platform) {
            Role newRole = roleRepository.findByName(request.getRole().toUpperCase().trim())
                    .orElseThrow(() -> new IllegalArgumentException("Rôle non trouvé: " + request.getRole()));
            user.setRole(newRole);
        }
        if (request.getNote() != null) user.setNote(request.getNote());

        user = userRepository.save(user);
        return authService.mapToUserResponse(user);
    }

    // ── Admin: Change user status ───────────────────────────────────────────────
    @Transactional
    public UserResponse changeStatus(Long id, AccountStatus newStatus) {
        User user = accessibleUser(id);
        Shop shop = user.getShopId() == null ? null : shopRepository.findById(user.getShopId()).orElse(null);
        if (shop != null && user.getId().equals(shop.getOwnerId()) && !CallerContext.isPlatformAdmin(caller.require())) {
            throw new IllegalArgumentException("Le compte du propriétaire ne peut pas être désactivé");
        }
        user.setStatus(newStatus);
        user = userRepository.save(user);
        if (newStatus != AccountStatus.ACTIVE) refreshTokenRepository.deleteByUserId(user.getId());
        return authService.mapToUserResponse(user);
    }

    // ── Admin: Delete user ────────────────────────────────────────────────────
    @Transactional
    public void deleteUser(Long id) {
        User user = findUserOrThrow(id);

        // 1. Delete refresh tokens
        refreshTokenRepository.deleteByUserId(id);

        // 2. Delete coupon usage history
        couponUsageRepository.deleteByUserId(id);

        // 3. Delete points transactions history
        pointsTransactionRepository.deleteAll(
                pointsTransactionRepository.findByUserIdOrderByCreatedAtDesc(id)
        );

        // 4. Delete product reviews
        reviewRepository.deleteAll(
                reviewRepository.findByUserIdOrderByCreatedAtDesc(id)
        );

        // 5. Dissociate user from orders (we keep the orders for accounting/history, but set user_id to null)
        List<Order> orders = orderRepository.findByUserIdOrderByCreatedAtDesc(id);
        for (Order order : orders) {
            order.setUser(null);
            orderRepository.save(order);
        }

        // 6. Delete user
        userRepository.delete(user);
    }


    // ── Admin: Get user by ID ─────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public UserResponse getUserById(Long id) {
        return authService.mapToUserResponse(accessibleUser(id));
    }

    // ── Admin: List all users with pagination ─────────────────────────────────
    @Transactional(readOnly = true)
    public Page<UserResponse> getAllUsers(Pageable pageable) {
        return getAllUsers(pageable, null);
    }

    public Page<UserResponse> getAllUsers(Pageable pageable, String shopSlug) {
        Long shopId = shopIdOf(shopSlug);
        Page<User> page = shopId == null
                ? userRepository.findAll(pageable)
                : shopId < 0
                    ? Page.empty(pageable)
                    : userRepository.findClientsByShopId(shopId, pageable);
        return page.map(authService::mapToUserResponse);
    }

    // ── Admin: Search users ───────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public Page<UserResponse> searchUsers(String query, Pageable pageable) {
        return searchUsers(query, pageable, null);
    }

    public Page<UserResponse> searchUsers(String query, Pageable pageable, String shopSlug) {
        Long shopId = shopIdOf(shopSlug);
        Page<User> page = shopId == null
                ? userRepository.search(query, pageable)
                : shopId < 0
                    ? Page.empty(pageable)
                    : userRepository.searchInShop(shopId, query, pageable);
        return page.map(authService::mapToUserResponse);
    }

    // ── Admin: Filter by role ─────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public Page<UserResponse> getUsersByRole(String roleName, Pageable pageable) {
        return userRepository.findByRoleName(roleName, pageable).map(authService::mapToUserResponse);
    }

    // ── Admin: Filter by status ───────────────────────────────────────────────
    @Transactional(readOnly = true)
    public Page<UserResponse> getUsersByStatus(AccountStatus status, Pageable pageable) {
        return getUsersByStatus(status, pageable, null);
    }

    public Page<UserResponse> getUsersByStatus(AccountStatus status, Pageable pageable, String shopSlug) {
        Long shopId = shopIdOf(shopSlug);
        Page<User> page = shopId == null
                ? userRepository.findByStatus(status, pageable)
                : shopId < 0
                    ? Page.empty(pageable)
                    : userRepository.findClientsByShopIdAndStatus(shopId, status, pageable);
        return page.map(authService::mapToUserResponse);
    }

    // ── Admin: Filter by segment ──────────────────────────────────────────────
    @Transactional(readOnly = true)
    public Page<UserResponse> getUsersBySegment(String segmentName, Pageable pageable) {
        return getUsersBySegment(segmentName, pageable, null);
    }

    public Page<UserResponse> getUsersBySegment(String segmentName, Pageable pageable, String shopSlug) {
        Long shopId = shopIdOf(shopSlug);
        Page<User> page = shopId == null
                ? userRepository.findBySegmentName(segmentName, pageable)
                : shopId < 0
                    ? Page.empty(pageable)
                    : userRepository.findByShopIdAndSegmentName(shopId, segmentName, pageable);
        return page.map(authService::mapToUserResponse);
    }

    private Long shopIdOf(String shopSlug) {
        if (shopSlug == null || shopSlug.isBlank()) return null;
        return shopRepository.findBySlug(shopSlug.trim().toLowerCase()).map(Shop::getId).orElse(-1L);
    }

    // ── Admin: Dashboard stats ────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public DashboardStatsResponse getDashboardStats(String shopSlug) {
        Long shopId = shopIdOf(shopSlug);
        long totalAdmins;
        long rolesCount;
        long teamActive = 0;
        if (shopId == null) {
            totalAdmins = userRepository.countByRoleName("ADMIN") + userRepository.countByRoleName("SUPER_ADMIN");
            rolesCount = roleRepository.findByShopIdIsNullOrderByIdAsc().size();
        } else if (shopId < 0) {
            totalAdmins = 0;
            rolesCount = 0;
        } else {
            totalAdmins = userRepository.countTeamByShop(shopId);
            rolesCount = roleRepository.findByShopIdOrderByIdAsc(shopId).size();
            teamActive = userRepository.countTeamByShopAndStatus(shopId, AccountStatus.ACTIVE);
        }
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        long totalClients;
        long activeClients;
        long newClientsLast30Days;
        long fideleClients;
        if (shopId != null && shopId < 0) {
            totalClients = 0;
            activeClients = 0;
            newClientsLast30Days = 0;
            fideleClients = 0;
        } else if (shopId != null) {
            totalClients = userRepository.countClientsByShop(shopId);
            activeClients = userRepository.countClientsByShopAndStatus(shopId, AccountStatus.ACTIVE);
            newClientsLast30Days = userRepository.countNewClientsByShopSince(shopId, thirtyDaysAgo);
            fideleClients = userRepository.countClientsByShopAndSegment(shopId, "FIDELE");
        } else {
            totalClients = userRepository.countByRoleName("CLIENT");
            activeClients = userRepository.countByStatus(AccountStatus.ACTIVE);
            newClientsLast30Days = userRepository.countNewClientsSince(thirtyDaysAgo);
            fideleClients = userRepository.countBySegmentName("FIDELE");
        }

        return DashboardStatsResponse.builder()
                .totalClients(totalClients)
                .activeClients(activeClients)
                .newClientsLast30Days(newClientsLast30Days)
                .fideleClients(fideleClients)
                .totalAdmins(totalAdmins)
                .rolesCount(rolesCount)
                .activeTeamMembers(teamActive)
                .build();
    }

    // ── Client: Update own profile ────────────────────────────────────────────
    @Transactional
    public UserResponse updateProfile(Long userId, UpdateProfileRequest request) {
        User user = findUserOrThrow(userId);

        if (request.getFirstName() != null) user.setFirstName(request.getFirstName());
        if (request.getLastName() != null) user.setLastName(request.getLastName());
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        if (request.getDateOfBirth() != null) user.setDateOfBirth(request.getDateOfBirth());
        if (request.getGender() != null) user.setGender(request.getGender());
        if (request.getAddress() != null) user.setAddress(request.getAddress());
        if (request.getCity() != null) user.setCity(request.getCity());
        if (request.getPostalCode() != null) user.setPostalCode(request.getPostalCode());
        if (request.getGouvernorat() != null) user.setGouvernorat(request.getGouvernorat());
        if (request.getCountry() != null) user.setCountry(request.getCountry());

        user = userRepository.save(user);
        return authService.mapToUserResponse(user);
    }

    // ── Client: Get own profile by userId ────────────────────────────────────
    @Transactional(readOnly = true)
    public UserResponse getProfile(Long userId) {
        return authService.mapToUserResponse(findUserOrThrow(userId));
    }

    // ── Client: Get own profile by email (JWT-based access) ──────────────────
    @Transactional(readOnly = true)
    public UserResponse getProfileByEmail(String email) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé: " + email));
        return authService.mapToUserResponse(user);
    }

    // ── Helper: resolve userId from email ─────────────────────────────────────
    @Transactional(readOnly = true)
    public Long getUserIdByEmail(String email) {
        return userRepository.findByEmailIgnoreCase(email)
                .map(User::getId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé: " + email));
    }

    // ── Cart persistence ──────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public String getCart(Long userId) {
        User user = findUserOrThrow(userId);
        return user.getCartJson() != null ? user.getCartJson() : "[]";
    }

    @Transactional
    public void saveCart(Long userId, String cartJson) {
        User user = findUserOrThrow(userId);
        user.setCartJson(cartJson);
        userRepository.save(user);
    }

    private User findUserOrThrow(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé avec l'id: " + id));
    }
}
