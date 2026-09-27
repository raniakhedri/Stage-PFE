package com.naturessence.auth.controller;

import com.naturessence.shared.dto.response.PlatformShopResponse;
import com.naturessence.shared.dto.response.UserResponse;
import com.naturessence.shared.entity.Shop;
import com.naturessence.shared.entity.User;
import com.naturessence.shared.repository.ProductRepository;
import com.naturessence.shared.repository.ShopRepository;
import com.naturessence.shared.repository.UserRepository;
import com.naturessence.auth.service.AuthService;
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

/** Read-only views for the Sellio platform administrator (SUPER_ADMIN). */
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
    private final JdbcTemplate jdbcTemplate;

    private record OrderStats(long count, double revenue, LocalDateTime lastOrderAt) {}

    @GetMapping("/stats")
    public Map<String, Object> stats() {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("shops", shopRepository.count());
        result.put("merchants", countUsersByRole("ADMIN"));
        result.put("clients", countUsersByRole("CLIENT"));
        result.put("products", productRepository.count());
        result.put("orders", queryLong("SELECT COUNT(*) FROM orders"));
        result.put("revenue", queryDouble("SELECT COALESCE(SUM(total), 0) FROM orders WHERE " + PAID_FILTER));
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
        result.put("clients", userRepository.findAll().stream()
                .filter(u -> id.equals(u.getShopId()) && u.getRole() != null && "CLIENT".equals(u.getRole().getName()))
                .sorted(Comparator.comparing(User::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(100)
                .map(authService::mapToUserResponse)
                .toList());
        result.put("recentOrders", queryList(
                "SELECT id, reference, first_name AS \"firstName\", last_name AS \"lastName\", total, status, "
                        + "created_at AS \"createdAt\" FROM orders WHERE shop_id = ? ORDER BY created_at DESC LIMIT 10", id));
        result.put("ordersByStatus", queryList(
                "SELECT status, COUNT(*) AS count FROM orders WHERE shop_id = ? GROUP BY status", id));
        result.put("activeProducts", productRepository.countByShopIdAndStatut(id, "actif"));
        result.put("outOfStock", productRepository.countRuptureByShopId(id));
        return result;
    }

    @GetMapping("/users")
    public List<UserResponse> users() {
        return userRepository.findAll(PageRequest.of(0, 500, Sort.by(Sort.Direction.DESC, "createdAt")))
                .stream()
                .map(authService::mapToUserResponse)
                .toList();
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
