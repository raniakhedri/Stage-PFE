package com.naturessence.auth.controller;

import com.naturessence.auth.service.UserService;
import com.naturessence.shared.dto.request.CreateUserRequest;
import com.naturessence.shared.dto.request.UpdateUserRequest;
import com.naturessence.shared.dto.response.DashboardStatsResponse;
import com.naturessence.shared.dto.response.MessageResponse;
import com.naturessence.shared.dto.response.UserResponse;
import com.naturessence.shared.enums.AccountStatus;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/users")
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
@RequiredArgsConstructor
public class AdminUserController {

    private final UserService userService;

    @PostMapping
    public ResponseEntity<UserResponse> createUser(@Valid @RequestBody CreateUserRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.createUser(request));
    }

    @GetMapping
    public ResponseEntity<Page<UserResponse>> getAllUsers(
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            @RequestParam(required = false) String shop) {
        return ResponseEntity.ok(userService.getAllUsers(pageable, shop));
    }

    // ── Team of the merchant's shop ──────────────────────────────────────────

    @GetMapping("/team")
    public ResponseEntity<List<UserResponse>> team() {
        return ResponseEntity.ok(userService.getTeam());
    }

    /** Body: firstName, lastName, email, phone, roleId. The member receives a one-time password by e-mail. */
    @PostMapping("/team")
    public ResponseEntity<UserResponse> inviteTeamMember(@RequestBody Map<String, Object> body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.inviteTeamMember(
                str(body.get("firstName")), str(body.get("lastName")), str(body.get("email")),
                str(body.get("phone")), longOf(body.get("roleId"))));
    }

    @PatchMapping("/team/{id}/role")
    public ResponseEntity<UserResponse> changeTeamRole(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(userService.changeTeamRole(id, longOf(body.get("roleId"))));
    }

    @PostMapping("/team/{id}/resend-invite")
    public ResponseEntity<MessageResponse> resendInvite(@PathVariable Long id) {
        userService.resendTeamInvite(id);
        return ResponseEntity.ok(new MessageResponse("Un nouveau mot de passe temporaire a été envoyé."));
    }

    @DeleteMapping("/team/{id}")
    public ResponseEntity<MessageResponse> removeTeamMember(@PathVariable Long id) {
        userService.removeTeamMember(id);
        return ResponseEntity.ok(new MessageResponse("Membre retiré de l'équipe"));
    }

    private static String str(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private static Long longOf(Object value) {
        if (value == null || String.valueOf(value).isBlank()) return null;
        try {
            return Long.valueOf(String.valueOf(value));
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Identifiant invalide");
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserResponse> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRequest request) {
        return ResponseEntity.ok(userService.updateUser(id, request));
    }

    /** Dedicated endpoint for status-only changes (toggle active/blocked/inactive). */
    @PatchMapping("/{id}/status")
    public ResponseEntity<UserResponse> changeStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String statusStr = body.get("status");
        if (statusStr == null || statusStr.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        AccountStatus newStatus;
        try {
            newStatus = AccountStatus.valueOf(statusStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(userService.changeStatus(id, newStatus));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<MessageResponse> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(new MessageResponse("Utilisateur supprimé avec succès"));
    }

    @GetMapping("/search")
    public ResponseEntity<Page<UserResponse>> searchUsers(
            @RequestParam String q,
            @PageableDefault(size = 10) Pageable pageable,
            @RequestParam(required = false) String shop) {
        return ResponseEntity.ok(userService.searchUsers(q, pageable, shop));
    }

    @GetMapping("/by-role/{roleName}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Page<UserResponse>> getUsersByRole(
            @PathVariable String roleName,
            @PageableDefault(size = 10) Pageable pageable) {
        return ResponseEntity.ok(userService.getUsersByRole(roleName, pageable));
    }

    @GetMapping("/by-status/{status}")
    public ResponseEntity<Page<UserResponse>> getUsersByStatus(
            @PathVariable AccountStatus status,
            @PageableDefault(size = 10) Pageable pageable,
            @RequestParam(required = false) String shop) {
        return ResponseEntity.ok(userService.getUsersByStatus(status, pageable, shop));
    }

    @GetMapping("/by-segment/{segmentName}")
    public ResponseEntity<Page<UserResponse>> getUsersBySegment(
            @PathVariable String segmentName,
            @PageableDefault(size = 10) Pageable pageable,
            @RequestParam(required = false) String shop) {
        return ResponseEntity.ok(userService.getUsersBySegment(segmentName, pageable, shop));
    }

    @GetMapping("/stats")
    public ResponseEntity<DashboardStatsResponse> getDashboardStats(
            @RequestParam(required = false) String shop) {
        return ResponseEntity.ok(userService.getDashboardStats(shop));
    }
}
