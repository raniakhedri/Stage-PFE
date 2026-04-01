package com.ecommerce.service;

import com.ecommerce.dto.request.CreateUserRequest;
import com.ecommerce.dto.request.UpdateProfileRequest;
import com.ecommerce.dto.request.UpdateUserRequest;
import com.ecommerce.dto.response.DashboardStatsResponse;
import com.ecommerce.dto.response.UserResponse;
import com.ecommerce.entity.Role;
import com.ecommerce.entity.Segment;
import com.ecommerce.entity.User;
import com.ecommerce.enums.AccountStatus;
import com.ecommerce.repository.CouponUsageRepository;
import com.ecommerce.repository.RefreshTokenRepository;
import com.ecommerce.repository.RoleRepository;
import com.ecommerce.repository.SegmentRepository;
import com.ecommerce.repository.UserRepository;
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

    // ── Admin: Create user ────────────────────────────────────────────────────
    @Transactional
    public UserResponse createUser(CreateUserRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Cet email est déjà utilisé");
        }

        Role role = roleRepository.findByName(request.getRole().toUpperCase().trim())
                .orElseThrow(() -> new RuntimeException("Rôle non trouvé: " + request.getRole()));

        Segment segment = null;
        if (request.getSegment() != null && !request.getSegment().isBlank()) {
            segment = segmentRepository.findByName(request.getSegment().toUpperCase().trim())
                    .orElseThrow(() -> new RuntimeException("Segment non trouvé: " + request.getSegment()));
        } else {
            segment = segmentRepository.findByName("NOUVEAU")
                    .orElseThrow(() -> new RuntimeException("Segment par défaut NOUVEAU introuvable"));
        }

        String encodedPassword;
        if (request.isSendInvite() || request.getPassword() == null || request.getPassword().isBlank()) {
            encodedPassword = passwordEncoder.encode("TempPass@" + System.currentTimeMillis());
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
        return authService.mapToUserResponse(user);
    }

    // ── Admin: Update user ────────────────────────────────────────────────────
    @Transactional
    public UserResponse updateUser(Long id, UpdateUserRequest request) {
        User user = findUserOrThrow(id);

        if (request.getFirstName() != null)
            user.setFirstName(request.getFirstName());
        if (request.getLastName() != null)
            user.setLastName(request.getLastName());
        if (request.getEmail() != null && !request.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new IllegalArgumentException("Cet email est déjà utilisé");
            }
            user.setEmail(request.getEmail().toLowerCase().trim());
        }
        if (request.getPhone() != null)
            user.setPhone(request.getPhone());
        if (request.getDateOfBirth() != null)
            user.setDateOfBirth(request.getDateOfBirth());
        if (request.getGender() != null)
            user.setGender(request.getGender());
        if (request.getAddress() != null)
            user.setAddress(request.getAddress());
        if (request.getCity() != null)
            user.setCity(request.getCity());
        if (request.getPostalCode() != null)
            user.setPostalCode(request.getPostalCode());
        if (request.getCountry() != null)
            user.setCountry(request.getCountry());
        if (request.getStatus() != null)
            user.setStatus(request.getStatus());
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
        if (request.getNote() != null)
            user.setNote(request.getNote());

        user = userRepository.save(user);
        return authService.mapToUserResponse(user);
    }

    // ── Admin: Delete user ────────────────────────────────────────────────────
    @Transactional
    public void deleteUser(Long id) {
        User user = findUserOrThrow(id);
        refreshTokenRepository.deleteByUserId(id);
        couponUsageRepository.deleteByUserId(id);
        userRepository.delete(user);
    }

    // ── Admin: Get user by ID ─────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public UserResponse getUserById(Long id) {
        User user = findUserOrThrow(id);
        return authService.mapToUserResponse(user);
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

    // ── Admin: Filter by segment ─────────────────────────────────────────────
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

        if (request.getFirstName() != null)
            user.setFirstName(request.getFirstName());
        if (request.getLastName() != null)
            user.setLastName(request.getLastName());
        if (request.getPhone() != null)
            user.setPhone(request.getPhone());
        if (request.getDateOfBirth() != null)
            user.setDateOfBirth(request.getDateOfBirth());
        if (request.getGender() != null)
            user.setGender(request.getGender());
        if (request.getAddress() != null)
            user.setAddress(request.getAddress());
        if (request.getCity() != null)
            user.setCity(request.getCity());
        if (request.getPostalCode() != null)
            user.setPostalCode(request.getPostalCode());
        if (request.getCountry() != null)
            user.setCountry(request.getCountry());

        user = userRepository.save(user);
        return authService.mapToUserResponse(user);
    }

    // ── Client: Get own profile ───────────────────────────────────────────────
    @Transactional(readOnly = true)
    public UserResponse getProfile(Long userId) {
        User user = findUserOrThrow(userId);
        return authService.mapToUserResponse(user);
    }

    private User findUserOrThrow(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé avec l'id: " + id));
    }
}
