package com.naturessence.auth.controller;

import com.naturessence.shared.dto.response.PlatformShopResponse;
import com.naturessence.shared.dto.response.UserResponse;
import com.naturessence.shared.entity.Shop;
import com.naturessence.shared.entity.User;
import com.naturessence.shared.repository.ProductRepository;
import com.naturessence.shared.repository.ShopRepository;
import com.naturessence.shared.repository.UserRepository;
import com.naturessence.auth.service.AuthService;
import com.naturessence.auth.service.MerchantVerificationService;
import com.naturessence.auth.service.PlatformAccountService;
import com.naturessence.auth.security.CallerContext;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Sellio console (SUPER_ADMIN and SELLIO_ADMIN). The Sellio team sees shops, merchants and platform figures,
 * never a shop's customers: customer accounts belong to the merchant.
 */
@RestController
@RequestMapping("/api/v1/admin/platform")
@RequiredArgsConstructor
public class PlatformController {

    /** Orders in these states are not counted as revenue. */
    private static final String PAID_FILTER = "status NOT IN ('ANNULEE', 'REMBOURSEE')";

    private final ShopRepository shopRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final AuthService authService;
    private final MerchantVerificationService verificationService;
    private final PlatformAccountService accountService;
    private final CallerContext caller;
    private final JdbcTemplate jdbcTemplate;

    private record OrderStats(long count, double revenue, LocalDateTime lastOrderAt) {}

    @GetMapping("/stats")
    public Map<String, Object> stats() {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("shops", shopRepository.count());
        result.put("merchants", countUsersByRole("ADMIN"));
        result.put("admins", countUsersByRole("SELLIO_ADMIN") + countUsersByRole("SUPER_ADMIN"));
        result.put("clients", countUsersByRole("CLIENT"));
        result.put("products", productRepository.count());
        result.put("orders", queryLong("SELECT COUNT(*) FROM orders"));
        result.put("revenue", queryDouble("SELECT COALESCE(SUM(total), 0) FROM orders WHERE " + PAID_FILTER));
        result.put("pendingVerifications", queryLong(
                "SELECT COUNT(*) FROM merchant_verifications WHERE status = 'PENDING'"));
        result.put("suspendedShops", queryLong("SELECT COUNT(*) FROM shops WHERE status = 'SUSPENDED'"));
        result.put("shopsThisMonth", queryLong(
                "SELECT COUNT(*) FROM shops WHERE created_at >= date_trunc('month', now())"));
        return result;
    }

    @GetMapping("/shops")
    public List<PlatformShopResponse> shops() {
        Map<Long, OrderStats> orders = orderStatsByShop();
        return shopRepository.findAll().stream()
                .map(shop -> toResponse(shop, orders.get(shop.getId())))
                .sorted(Comparator.comparing(PlatformShopResponse::getCreatedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();
    }

    @GetMapping("/shops/{id}")
    public Map<String, Object> shop(@PathVariable Long id) {
        Shop shop = shopRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Boutique introuvable"));
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("shop", toResponse(shop, orderStatsByShop().get(id)));
        result.put("owner", shop.getOwnerId() == null ? null
                : userRepository.findById(shop.getOwnerId()).map(authService::mapToUserResponse).orElse(null));
        // Customers' identities stay with the merchant: orders are shown without names.
        result.put("recentOrders", queryList(
                "SELECT id, reference, total, status, created_at AS \"createdAt\" "
                        + "FROM orders WHERE shop_id = ? ORDER BY created_at DESC LIMIT 10", id));
        result.put("ordersByStatus", queryList(
                "SELECT status, COUNT(*) AS count FROM orders WHERE shop_id = ? GROUP BY status", id));
        result.put("activeProducts", productRepository.countByShopIdAndStatut(id, "actif"));
        result.put("outOfStock", productRepository.countRuptureByShopId(id));
        return result;
    }

    /** body: {"status": "SUSPENDED" | "ACTIVE"} — suspending also blocks the owner's account. */
    @PatchMapping("/shops/{id}/status")
    public PlatformShopResponse setShopStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String status = body.getOrDefault("status", "");
        if (!Shop.SUSPENDED.equals(status) && !Shop.ACTIVE.equals(status)) {
            throw new IllegalArgumentException("Statut attendu : SUSPENDED ou ACTIVE");
        }
        verificationService.setShopSuspended(id, Shop.SUSPENDED.equals(status));
        Shop shop = shopRepository.findById(id).orElseThrow();
        return toResponse(shop, orderStatsByShop().get(id));
    }

    /** body: {"status": "BLOCKED" | "ACTIVE"} */
    @PatchMapping("/users/{id}/status")
    public UserResponse setUserStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String status = body.getOrDefault("status", "");
        if (!"BLOCKED".equals(status) && !"ACTIVE".equals(status)) {
            throw new IllegalArgumentException("Statut attendu : BLOCKED ou ACTIVE");
        }
        User user = userRepository.findById(id)
                .filter(u -> u.getRole() != null && "ADMIN".equals(u.getRole().getName()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Marchand introuvable"));
        verificationService.setUserBlocked(user, "BLOCKED".equals(status));
        return authService.mapToUserResponse(user);
    }

    @GetMapping("/verifications")
    public List<Map<String, Object>> verifications() {
        return verificationService.list();
    }

    @GetMapping("/verifications/{id}")
    public Map<String, Object> verification(@PathVariable Long id) {
        return verificationService.detail(id);
    }

    @PostMapping("/verifications/{id}/approve")
    public Map<String, Object> approve(@PathVariable Long id) {
        return verificationService.approve(id, caller.require().getEmail());
    }

    /** body: {"reason": "..."} — shown to the merchant, who can then send a new file. */
    @PostMapping("/verifications/{id}/reject")
    public Map<String, Object> reject(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return verificationService.reject(id, body.get("reason"), caller.require().getEmail());
    }

    /** Merchants and Sellio administrators. Shop customers and shop staff are not listed. */
    @GetMapping("/users")
    public List<UserResponse> users() {
        return accountService.accounts();
    }

    /** Super admin: body {"firstName", "lastName", "email", "role": "SELLIO_ADMIN" | "SUPER_ADMIN"}. */
    @PostMapping("/users")
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse createAdmin(@RequestBody Map<String, String> body) {
        return accountService.createAdmin(caller.require(), body.get("firstName"), body.get("lastName"),
                body.get("email"), body.get("role"));
    }

    /** Super admin: body {"role": "ADMIN" | "SELLIO_ADMIN" | "SUPER_ADMIN"}. */
    @PatchMapping("/users/{id}/role")
    public UserResponse changeRole(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return accountService.changeRole(caller.require(), id, body.get("role"));
    }

    /** Deletes a merchant together with their shop, its customers and all of its data (or, for a super admin, a platform account). */
    @DeleteMapping("/users/{id}")
    public Map<String, Object> deleteAccount(@PathVariable Long id) {
        return accountService.deleteAccount(caller.require(), id);
    }

    private PlatformShopResponse toResponse(Shop shop, OrderStats orders) {
        User owner = shop.getOwnerId() == null ? null : userRepository.findById(shop.getOwnerId()).orElse(null);
        return PlatformShopResponse.builder()
                .id(shop.getId())
                .name(shop.getName())
                .slug(shop.getSlug())
                .businessType(shop.getBusinessType())
                .templateKey(shop.getTemplateKey())
                .logo(shop.getLogo())
                .primaryColor(shop.getPrimaryColor())
                .accentColor(shop.getAccentColor())
                .backgroundColor(shop.getBackgroundColor())
                .createdAt(shop.getCreatedAt())
                .status(Shop.statusOf(shop))
                .ownerId(owner != null ? owner.getId() : null)
                .ownerEmail(owner != null ? owner.getEmail() : null)
                .ownerName(owner != null ? (owner.getFirstName() + " " + owner.getLastName()).trim() : null)
                .ownerPhone(owner != null ? owner.getPhone() : null)
                .ownerStatus(owner != null && owner.getStatus() != null ? owner.getStatus().name() : null)
                .ownerLastLogin(owner != null ? owner.getLastLogin() : null)
                .clientCount(userRepository.countByShopId(shop.getId()))
                .productCount(productRepository.countByShopId(shop.getId()))
                .orderCount(orders != null ? orders.count() : 0)
                .revenue(orders != null ? orders.revenue() : 0)
                .lastOrderAt(orders != null ? orders.lastOrderAt() : null)
                .build();
    }

    private Map<Long, OrderStats> orderStatsByShop() {
        Map<Long, OrderStats> stats = new HashMap<>();
        try {
            jdbcTemplate.query(
                    "SELECT shop_id, COUNT(*) AS n, "
                            + "COALESCE(SUM(CASE WHEN " + PAID_FILTER + " THEN total ELSE 0 END), 0) AS revenue, "
                            + "MAX(created_at) AS last_at FROM orders WHERE shop_id IS NOT NULL GROUP BY shop_id",
                    rs -> {
                        Timestamp last = rs.getTimestamp("last_at");
                        stats.put(rs.getLong("shop_id"), new OrderStats(
                                rs.getLong("n"), rs.getDouble("revenue"), last != null ? last.toLocalDateTime() : null));
                    });
        } catch (Exception ignored) {
            // The orders table may not exist yet on a fresh database.
        }
        return stats;
    }

    private List<Map<String, Object>> queryList(String sql, Object... args) {
        try {
            return jdbcTemplate.queryForList(sql, args);
        } catch (Exception e) {
            return List.of();
        }
    }

    private long countUsersByRole(String role) {
        try {
            Long value = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM users u JOIN roles r ON r.id = u.role_id WHERE r.name = ?", Long.class, role);
            return value != null ? value : 0;
        } catch (Exception e) {
            return 0;
        }
    }

    private long queryLong(String sql) {
        try {
            Long value = jdbcTemplate.queryForObject(sql, Long.class);
            return value != null ? value : 0;
        } catch (Exception e) {
            return 0;
        }
    }

    private double queryDouble(String sql) {
        try {
            Double value = jdbcTemplate.queryForObject(sql, Double.class);
            return value != null ? value : 0;
        } catch (Exception e) {
            return 0;
        }
    }
}
