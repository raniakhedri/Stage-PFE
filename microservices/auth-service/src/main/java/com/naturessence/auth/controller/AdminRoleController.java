package com.naturessence.auth.controller;

import com.naturessence.auth.service.RoleService;
import com.naturessence.shared.dto.request.RoleRequest;
import com.naturessence.shared.dto.request.UpdatePermissionsRequest;
import com.naturessence.shared.dto.response.ApiResponse;
import com.naturessence.shared.dto.response.PermissionDTO;
import com.naturessence.shared.dto.response.RoleResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/roles")
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
@RequiredArgsConstructor
public class AdminRoleController {

    private final RoleService roleService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<RoleResponse>>> getAllRoles() {
        return ResponseEntity.ok(ApiResponse.ok("Liste des rôles", roleService.getAllRoles()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<RoleResponse>> getRoleById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Rôle trouvé", roleService.getRoleById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<RoleResponse>> createRole(@Valid @RequestBody RoleRequest request) {
        try {
            return ResponseEntity.ok(ApiResponse.ok("Rôle créé avec succès", roleService.createRole(request)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<RoleResponse>> updateRole(
            @PathVariable Long id,
            @Valid @RequestBody RoleRequest request) {
        try {
            return ResponseEntity.ok(ApiResponse.ok("Rôle modifié avec succès", roleService.updateRole(id, request)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteRole(@PathVariable Long id) {
        try {
            roleService.deleteRole(id);
            return ResponseEntity.ok(ApiResponse.ok("Rôle supprimé avec succès"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}/permissions")
    public ResponseEntity<ApiResponse<RoleResponse>> updatePermissions(
            @PathVariable Long id,
            @Valid @RequestBody UpdatePermissionsRequest request) {
        try {
            return ResponseEntity
                    .ok(ApiResponse.ok("Permissions mises à jour", roleService.updatePermissions(id, request)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/permissions")
    public ResponseEntity<ApiResponse<List<PermissionDTO>>> getAllPermissions() {
        return ResponseEntity.ok(ApiResponse.ok("Liste des permissions", roleService.getAllPermissions()));
    }

    @GetMapping("/permissions-matrix")
    public ResponseEntity<ApiResponse<Map<String, Map<String, Boolean>>>> getPermissionMatrix() {
        return ResponseEntity.ok(ApiResponse.ok("Matrice des permissions", roleService.getPermissionMatrix()));
    }
}
