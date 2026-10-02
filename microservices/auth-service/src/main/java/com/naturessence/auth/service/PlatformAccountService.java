package com.naturessence.auth.service;

import com.naturessence.shared.dto.response.UserResponse;
import com.naturessence.shared.entity.Role;
import com.naturessence.shared.entity.Segment;
import com.naturessence.shared.entity.Shop;
import com.naturessence.shared.entity.User;
import com.naturessence.shared.enums.AccountStatus;
import com.naturessence.shared.repository.RoleRepository;
import com.naturessence.shared.repository.SegmentRepository;
import com.naturessence.shared.repository.ShopRepository;
import com.naturessence.shared.repository.UserRepository;
import com.naturessence.shared.security.PlatformRoles;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Accounts the Sellio team manages from the console: merchants and platform administrators.
 * <ul>
 *   <li>Sellio admins and super admins can delete a merchant: the shop and everything in it go too
 *       (customers, team, catalogue, orders, marketing, analytics).</li>
 *   <li>Only a super admin adds platform admins, changes roles and deletes platform accounts.</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PlatformAccountService {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String PASSWORD_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final SegmentRepository segmentRepository;
    private final ShopRepository shopRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final AuthService authService;
    private final JdbcTemplate jdbc;

    /** Merchants and platform administrators, newest first. Customers and shop staff are never listed. */
    @Transactional(readOnly = true)
    public List<UserResponse> accounts() {
        return userRepository.findByRoleNames(List.of(PlatformRoles.MERCHANT, PlatformRoles.SELLIO_ADMIN, PlatformRoles.SUPER_ADMIN))
                .stream().map(authService::mapToUserResponse).toList();
    }

    /** Super admin only: adds a Sellio admin (or another super admin) and e-mails a one-time password. */
    @Transactional
    public UserResponse createAdmin(User caller, String firstName, String lastName, String email, String roleName) {
        requireSuperAdmin(caller);
        String role = roleName == null || roleName.isBlank() ? PlatformRoles.SELLIO_ADMIN : roleName.trim().toUpperCase();
        if (!PlatformRoles.isPlatform(role)) {
            throw new IllegalArgumentException("Rôle attendu : SELLIO_ADMIN ou SUPER_ADMIN");
        }
        if (firstName == null || firstName.isBlank() || email == null || !email.contains("@")) {
            throw new IllegalArgumentException("Prénom et e-mail valides obligatoires");
        }
        String key = email.trim().toLowerCase();
        if (userRepository.accountEmailTaken(key)) {
            throw new IllegalArgumentException("Cet email est déjà utilisé");
        }
        Segment segment = segmentRepository.findByName("NOUVEAU")
                .orElseThrow(() -> new IllegalStateException("Segment NOUVEAU introuvable"));
        String tempPassword = temporaryPassword();
        User admin = userRepository.save(User.builder()
                .firstName(firstName.trim())
                .lastName(lastName == null ? "" : lastName.trim())
                .email(key)
                .password(passwordEncoder.encode(tempPassword))
                .role(role(role))
                .segment(segment)
                .status(AccountStatus.ACTIVE)
                .mustChangePassword(true)
                .build());
        emailService.sendAccountInvite(admin, tempPassword, null, null, true);
        return authService.mapToUserResponse(admin);
    }

    /**
     * Super admin only. Roles go between merchant, Sellio admin and super admin. A merchant who owns a shop
     * cannot become a platform account (the Sellio team has no shop and no access to shop data).
     */
    @Transactional
    public UserResponse changeRole(User caller, Long userId, String roleName) {
        requireSuperAdmin(caller);
        User user = managedAccount(userId);
        String target = roleName == null ? "" : roleName.trim().toUpperCase();
        if (!PlatformRoles.ASSIGNABLE.contains(target)) {
            throw new IllegalArgumentException("Rôle attendu : ADMIN (marchand), SELLIO_ADMIN ou SUPER_ADMIN");
        }
        if (user.getId().equals(caller.getId())) {
            throw new IllegalArgumentException("Vous ne pouvez pas modifier votre propre rôle.");
        }
        String current = user.getRole().getName();
        if (current.equals(target)) return authService.mapToUserResponse(user);
        if (PlatformRoles.isPlatform(target) && user.getShopId() != null) {
            throw new IllegalArgumentException(
                    "Ce marchand possède une boutique : supprimez-la avant d'en faire un compte Sellio.");
        }
        if (PlatformRoles.SUPER_ADMIN.equals(current)) requireAnotherSuperAdmin(user);
        user.setRole(role(target));
        return authService.mapToUserResponse(userRepository.save(user));
    }

    /**
     * Deletes a merchant with their shop and all of its data, or (super admin only) a platform account.
     * Returns what was removed, for the console's confirmation message.
     */
    @Transactional
    public Map<String, Object> deleteAccount(User caller, Long userId) {
        User user = managedAccount(userId);
        if (user.getId().equals(caller.getId())) {
            throw new IllegalArgumentException("Vous ne pouvez pas supprimer votre propre compte.");
        }
        String role = user.getRole().getName();
        Map<String, Object> result = new HashMap<>();
        result.put("email", user.getEmail());
        if (PlatformRoles.isPlatform(role)) {
            requireSuperAdmin(caller);
            if (PlatformRoles.SUPER_ADMIN.equals(role)) requireAnotherSuperAdmin(user);
            purge("users", "id = ?", user.getId());
            result.put("shop", null);
            log.info("Compte plateforme {} supprimé par {}", user.getEmail(), caller.getEmail());
            return result;
        }
        Shop shop = user.getShopId() == null ? null : shopRepository.findById(user.getShopId()).orElse(null);
        if (shop != null) {
            result.put("shop", shop.getName());
            result.put("clients", userRepository.countClientsByShop(shop.getId()));
            deleteShopData(shop.getId());
        }
        purge("users", "id = ?", user.getId());
        log.info("Marchand {} supprimé par {} (boutique : {})", user.getEmail(), caller.getEmail(),
                shop != null ? shop.getSlug() : "aucune");
        return result;
    }

    // ── Shop deletion ────────────────────────────────────────────────────────

    private record ForeignKey(String child, String childColumn, String parentColumn) {}

    /**
     * Removes every row of the shop: first each table with a {@code shop_id} column, then the shop itself.
     * Rows that point at deleted rows through a foreign key (order lines, reviews, refresh tokens,
     * permissions of the shop's roles…) are removed before the rows they point at.
     */
    private void deleteShopData(Long shopId) {
        List<String> tables = jdbc.queryForList("""
                SELECT c.relname FROM pg_attribute a
                JOIN pg_class c ON c.oid = a.attrelid
                JOIN pg_namespace n ON n.oid = c.relnamespace
                WHERE a.attname = 'shop_id' AND NOT a.attisdropped AND n.nspname = 'public'
                  AND c.relkind IN ('r', 'p') AND NOT c.relispartition AND c.relname <> 'shops'
                """, String.class);
        for (String table : tables) {
            purge(table, "shop_id = ?", shopId);
        }
        purge("shops", "id = ?", shopId);
    }

    private void purge(String table, String where, Object... args) {
        purge(table, where, args, foreignKeys(), new HashSet<>());
    }

    private void purge(String table, String where, Object[] args, Map<String, List<ForeignKey>> fks, Set<String> path) {
        if (!path.add(table)) return; // reference cycle: the rows are removed by the outer call
        for (ForeignKey fk : fks.getOrDefault(table, List.of())) {
            if (fk.child().equals(table)) continue; // self-reference: parent and children go in one statement
            purge(fk.child(), quote(fk.childColumn()) + " IN (SELECT " + quote(fk.parentColumn())
                    + " FROM " + quote(table) + " WHERE " + where + ")", args, fks, path);
        }
        jdbc.update("DELETE FROM " + quote(table) + " WHERE " + where, args);
        path.remove(table);
    }

    /** Single-column foreign keys of the public schema, grouped by the referenced table. */
    private Map<String, List<ForeignKey>> foreignKeys() {
        Map<String, List<ForeignKey>> map = new HashMap<>();
        jdbc.query("""
                SELECT parent.relname AS parent, child.relname AS child, ca.attname AS child_col, pa.attname AS parent_col
                FROM pg_constraint k
                JOIN pg_class child ON child.oid = k.conrelid
                JOIN pg_class parent ON parent.oid = k.confrelid
                JOIN pg_namespace n ON n.oid = child.relnamespace
                JOIN pg_attribute ca ON ca.attrelid = k.conrelid AND ca.attnum = k.conkey[1]
                JOIN pg_attribute pa ON pa.attrelid = k.confrelid AND pa.attnum = k.confkey[1]
                WHERE k.contype = 'f' AND cardinality(k.conkey) = 1 AND n.nspname = 'public'
                  AND NOT child.relispartition
                """, rs -> {
            map.computeIfAbsent(rs.getString("parent"), k -> new ArrayList<>())
                    .add(new ForeignKey(rs.getString("child"), rs.getString("child_col"), rs.getString("parent_col")));
        });
        return map;
    }

    private static String quote(String identifier) {
        return "\"" + identifier.replace("\"", "\"\"") + "\"";
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    /** A merchant or platform account; customers and shop staff are not managed from the console. */
    private User managedAccount(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Compte introuvable"));
        String role = user.getRole() != null ? user.getRole().getName() : "";
        boolean managed = user.getRole() != null && user.getRole().getShopId() == null
                && (PlatformRoles.MERCHANT.equals(role) || PlatformRoles.isPlatform(role));
        if (!managed) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Compte introuvable");
        return user;
    }

    private void requireSuperAdmin(User caller) {
        if (caller.getRole() == null || !PlatformRoles.SUPER_ADMIN.equals(caller.getRole().getName())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Réservé au super administrateur Sellio.");
        }
    }

    private void requireAnotherSuperAdmin(User leaving) {
        if (userRepository.countByRoleName(PlatformRoles.SUPER_ADMIN) <= 1) {
            throw new IllegalArgumentException("Sellio doit garder au moins un super administrateur.");
        }
    }

    private Role role(String name) {
        return roleRepository.findByName(name)
                .orElseThrow(() -> new IllegalStateException("Rôle " + name + " introuvable"));
    }

    private static String temporaryPassword() {
        StringBuilder sb = new StringBuilder("Tmp-");
        for (int i = 0; i < 8; i++) sb.append(PASSWORD_CHARS.charAt(RANDOM.nextInt(PASSWORD_CHARS.length())));
        return sb.toString();
    }
}
