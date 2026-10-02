package com.naturessence.auth.service;

import com.naturessence.auth.security.CallerContext;
import com.naturessence.shared.dto.request.RoleRequest;
import com.naturessence.shared.dto.request.UpdatePermissionsRequest;
import com.naturessence.shared.dto.response.PermissionDTO;
import com.naturessence.shared.dto.response.RoleResponse;
import com.naturessence.shared.entity.Permission;
import com.naturessence.shared.entity.Role;
import com.naturessence.shared.entity.User;
import com.naturessence.shared.enums.PermissionModule;
import com.naturessence.shared.repository.RoleRepository;
import com.naturessence.shared.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.text.Normalizer;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Roles and their page permissions.
 * <p>The Sellio admin manages the platform roles (SUPER_ADMIN, ADMIN, CLIENT). A merchant only sees and
 * manages the roles of their own shop: those roles are stored with the shop id, and their system name is
 * prefixed ({@code S12_PREPARATEUR}) so two shops can both have a "Préparateur".
 */
@Service
@RequiredArgsConstructor
public class RoleService {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final CallerContext caller;

    // ── GET roles visible to the caller ───────────────────────────────────────
    @Transactional(readOnly = true)
    public List<RoleResponse> getAllRoles() {
        return visibleRoles(caller.require()).stream()
                .map(this::mapToRoleResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public RoleResponse getRoleById(Long id) {
        return mapToRoleResponse(ownedRole(caller.require(), id));
    }

    @Transactional(readOnly = true)
    public RoleResponse getRoleByName(String name) {
        Role role = roleRepository.findByName(name)
                .orElseThrow(() -> new RuntimeException("Rôle non trouvé: " + name));
        return mapToRoleResponse(role);
    }

    // ── CREATE role ───────────────────────────────────────────────────────────
    @Transactional
    public RoleResponse createRole(RoleRequest request) {
        User me = caller.require();
        Long shopId = CallerContext.isPlatformAdmin(me) ? null : caller.requireShopId(me);
        String systemName = systemName(request, shopId);

        if (roleRepository.existsByName(systemName)) {
            throw new IllegalArgumentException("Un rôle « " + request.getLabel() + " » existe déjà");
        }

        Role role = Role.builder()
                .name(systemName)
                .label(request.getLabel().trim())
                .description(request.getDescription())
                .shopId(shopId)
                .build();

        for (PermissionModule module : PermissionModule.values()) {
            boolean granted = request.getPermissions() != null
                    && Boolean.TRUE.equals(request.getPermissions().get(module.name()));
            role.addPermission(Permission.builder().module(module).granted(granted).build());
        }

        return mapToRoleResponse(roleRepository.save(role));
    }

    // ── UPDATE role ───────────────────────────────────────────────────────────
    @Transactional
    public RoleResponse updateRole(Long id, RoleRequest request) {
        User me = caller.require();
        Role role = ownedRole(me, id);

        String systemName = systemName(request, role.getShopId());
        if (!role.getName().equals(systemName) && roleRepository.existsByName(systemName)) {
            throw new IllegalArgumentException("Un rôle « " + request.getLabel() + " » existe déjà");
        }
        // Platform role keys are referenced in code; they keep their name.
        if (role.getShopId() != null) role.setName(systemName);
        role.setLabel(request.getLabel().trim());
        role.setDescription(request.getDescription());

        if (request.getPermissions() != null) {
            updateRolePermissions(role, request.getPermissions());
        }
        return mapToRoleResponse(roleRepository.save(role));
    }

    // ── DELETE role ───────────────────────────────────────────────────────────
    @Transactional
    public void deleteRole(Long id) {
        Role role = ownedRole(caller.require(), id);
        if (role.getShopId() == null && Set.of("SUPER_ADMIN", "SELLIO_ADMIN", "ADMIN", "CLIENT").contains(role.getName())) {
            throw new IllegalArgumentException("Ce rôle système ne peut pas être supprimé");
        }
        long userCount = userRepository.countByRoleId(id);
        if (userCount > 0) {
            throw new IllegalArgumentException(
                    "Impossible de supprimer le rôle « " + role.getLabel() +
                            " » : " + userCount + " membre(s) y sont affecté(s). Changez d'abord leur rôle.");
        }
        roleRepository.delete(role);
    }

    // ── UPDATE permissions for a role ─────────────────────────────────────────
    @Transactional
    public RoleResponse updatePermissions(Long roleId, UpdatePermissionsRequest request) {
        Role role = ownedRole(caller.require(), roleId);
        updateRolePermissions(role, request.getPermissions());
        return mapToRoleResponse(roleRepository.save(role));
    }

    public List<PermissionDTO> getAllPermissions() {
        List<PermissionDTO> permissions = new ArrayList<>();
        for (PermissionModule module : PermissionModule.values()) {
            permissions.add(PermissionDTO.builder().module(module.name()).label(module.getLabel()).build());
        }
        return permissions;
    }

    @Transactional(readOnly = true)
    public Map<String, Map<String, Boolean>> getPermissionMatrix() {
        Map<String, Map<String, Boolean>> matrix = new LinkedHashMap<>();
        for (Role role : visibleRoles(caller.require())) {
            matrix.put(role.getName(), permissionMap(role));
        }
        return matrix;
    }

    /** A role of the caller's shop (or a platform role for the Sellio admin); used to assign team members. */
    public Role ownedRole(User me, Long id) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Rôle non trouvé"));
        if (CallerContext.isPlatformAdmin(me)) {
            if (role.getShopId() != null) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Rôle d'une boutique");
            return role;
        }
        if (role.getShopId() == null || !role.getShopId().equals(me.getShopId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Ce rôle n'appartient pas à votre boutique");
        }
        return role;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private List<Role> visibleRoles(User me) {
        if (CallerContext.isPlatformAdmin(me)) return roleRepository.findByShopIdIsNullOrderByIdAsc();
        if (me.getShopId() == null) return List.of();
        return roleRepository.findByShopIdOrderByIdAsc(me.getShopId());
    }

    private String systemName(RoleRequest request, Long shopId) {
        if (request.getLabel() == null || request.getLabel().isBlank()) {
            throw new IllegalArgumentException("Le libellé du rôle est obligatoire");
        }
        String source = request.getName() != null && !request.getName().isBlank() ? request.getName() : request.getLabel();
        String key = Normalizer.normalize(source, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toUpperCase()
                .replaceAll("[^A-Z0-9]+", "_")
                .replaceAll("(^_|_$)", "");
        if (key.isBlank()) throw new IllegalArgumentException("Nom de rôle invalide");
        if (shopId == null) return key;
        String prefix = "S" + shopId + "_";
        return key.startsWith(prefix) ? key : prefix + key;
    }

    private void updateRolePermissions(Role role, Map<String, Boolean> permissions) {
        for (Map.Entry<String, Boolean> entry : permissions.entrySet()) {
            PermissionModule module;
            try {
                module = PermissionModule.valueOf(entry.getKey());
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Module de permission invalide: " + entry.getKey());
            }
            boolean granted = Boolean.TRUE.equals(entry.getValue());
            Permission existing = role.getPermissions().stream()
                    .filter(p -> p.getModule() == module)
                    .findFirst()
                    .orElse(null);
            if (existing != null) {
                existing.setGranted(granted);
            } else {
                role.addPermission(Permission.builder().module(module).granted(granted).build());
            }
        }
    }

    private Map<String, Boolean> permissionMap(Role role) {
        Map<String, Boolean> permMap = new LinkedHashMap<>();
        for (PermissionModule module : PermissionModule.values()) permMap.put(module.name(), false);
        for (Permission perm : role.getPermissions()) permMap.put(perm.getModule().name(), perm.isGranted());
        return permMap;
    }

    private RoleResponse mapToRoleResponse(Role role) {
        return RoleResponse.builder()
                .id(role.getId())
                .name(role.getName())
                .label(role.getLabel())
                .description(role.getDescription())
                .userCount(userRepository.countByRoleId(role.getId()))
                .permissions(permissionMap(role))
                .build();
    }
}
