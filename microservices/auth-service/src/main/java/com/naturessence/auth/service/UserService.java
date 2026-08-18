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
import com.naturessence.shared.repository.SegmentRepository;
import com.naturessence.shared.repository.UserRepository;

import java.util.List;
import lombok.RequiredArgsConstructor;
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


    // ── Admin: Create user ────────────────────────────────────────────────────
    @Transactional
    public UserResponse createUser(CreateUserRequest request) {
        if (userRepository.existsByEmailIgnoreCase(request.getEmail())) {
            throw new IllegalArgumentException("Cet email est déjà utilisé");
        }

        Role role = roleRepository.findByName(request.getRole().toUpperCase().trim())
                .orElseThrow(() -> new RuntimeException("Rôle non trouvé: " + request.getRole()));

        Segment segment;
        if (request.getSegment() != null && !request.getSegment().isBlank()) {
            segment = segmentRepository.findByName(request.getSegment().toUpperCase().trim())
                    .orElseThrow(() -> new RuntimeException("Segment non trouvé: " + request.getSegment()));
        } else {
            segment = segmentRepository.findByName("NOUVEAU")
                    .orElseThrow(() -> new RuntimeException("Segment par défaut NOUVEAU introuvable"));
        }

        String rawTempPassword = null;
        String encodedPassword;
        if (request.isSendInvite() || request.getPassword() == null || request.getPassword().isBlank()) {
            rawTempPassword = "NaturEssence@" + (System.currentTimeMillis() % 100000);
            encodedPassword = passwordEncoder.encode(rawTempPassword);
        } else {
            encodedPassword = passwordEncoder.encode(request.getPassword());
        }

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
                .build();

        user = userRepository.save(user);

        if (request.isSendInvite() && rawTempPassword != null) {
            emailService.sendAccountInvite(user, rawTempPassword);
        }

        return authService.mapToUserResponse(user);
    }

    // ── Admin: Update user ────────────────────────────────────────────────────
    @Transactional
    public UserResponse updateUser(Long id, UpdateUserRequest request) {
        User user = findUserOrThrow(id);

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
        if (request.getRole() != null) {
            Role newRole = roleRepository.findByName(request.getRole().toUpperCase().trim())
                    .orElseThrow(() -> new RuntimeException("Rôle non trouvé: " + request.getRole()));
            user.setRole(newRole);
        }
        if (request.getNote() != null) user.setNote(request.getNote());

        user = userRepository.save(user);
        return authService.mapToUserResponse(user);
    }

    // ── Admin: Change user status ───────────────────────────────────────────────
    @Transactional
    public UserResponse changeStatus(Long id, AccountStatus newStatus) {
        User user = findUserOrThrow(id);
        user.setStatus(newStatus);
        user = userRepository.save(user);
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
        return authService.mapToUserResponse(findUserOrThrow(id));
    }

    // ── Admin: List all users with pagination ─────────────────────────────────
    @Transactional(readOnly = true)
    public Page<UserResponse> getAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable).map(authService::mapToUserResponse);
    }

    // ── Admin: Search users ───────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public Page<UserResponse> searchUsers(String query, Pageable pageable) {
        return userRepository.search(query, pageable).map(authService::mapToUserResponse);
    }

    // ── Admin: Filter by role ─────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public Page<UserResponse> getUsersByRole(String roleName, Pageable pageable) {
        return userRepository.findByRoleName(roleName, pageable).map(authService::mapToUserResponse);
    }

    // ── Admin: Filter by status ───────────────────────────────────────────────
    @Transactional(readOnly = true)
    public Page<UserResponse> getUsersByStatus(AccountStatus status, Pageable pageable) {
        return userRepository.findByStatus(status, pageable).map(authService::mapToUserResponse);
    }

    // ── Admin: Filter by segment ──────────────────────────────────────────────
    @Transactional(readOnly = true)
    public Page<UserResponse> getUsersBySegment(String segmentName, Pageable pageable) {
        return userRepository.findBySegmentName(segmentName, pageable).map(authService::mapToUserResponse);
    }

    // ── Admin: Dashboard stats ────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public DashboardStatsResponse getDashboardStats() {
        long totalClients = userRepository.countByRoleName("CLIENT");
        long activeClients = userRepository.countByStatus(AccountStatus.ACTIVE);
        long totalAdmins = userRepository.countByRoleName("ADMIN")
                + userRepository.countByRoleName("SUPER_ADMIN");
        long rolesCount = roleRepository.count();

        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        long newClientsLast30Days = userRepository.countNewClientsSince(thirtyDaysAgo);
        long fideleClients = userRepository.countBySegmentName("FIDELE");

        return DashboardStatsResponse.builder()
                .totalClients(totalClients)
                .activeClients(activeClients)
                .newClientsLast30Days(newClientsLast30Days)
                .fideleClients(fideleClients)
                .totalAdmins(totalAdmins)
                .rolesCount(rolesCount)
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
