package com.naturessence.shared.security;

import com.naturessence.shared.entity.Shop;
import com.naturessence.shared.repository.ShopRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.server.ResponseStatusException;

/**
 * Multi-tenant checks for the merchant APIs. {@link JwtAuthenticationFilter} pins the caller's shop on
 * every merchant request; services call this class so a merchant can neither reach a record of another
 * shop by its id nor create one in another shop by changing the request body.
 * The Sellio admin (no pinned shop) keeps access to every shop.
 */
public final class TenantGuard {

    /** Request attribute holding the caller's shop slug (set by the JWT filter on merchant APIs). */
    public static final String ATTRIBUTE = "sellio.tenantShop";

    private TenantGuard() {
    }

    /** Slug of the caller's shop, or null for the platform admin and for public requests. */
    public static String pinnedShop() {
        if (!(RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attrs)) return null;
        HttpServletRequest request = attrs.getRequest();
        Object value = request.getAttribute(ATTRIBUTE);
        return value == null ? null : value.toString();
    }

    /** Shop used when creating a record: always the caller's own shop for merchants. */
    public static String shopForCreation(String requested) {
        String pinned = pinnedShop();
        return pinned != null ? pinned : requested;
    }

    /** Refuses (404) a record that belongs to another shop than the caller's. */
    public static void assertOwned(Long recordShopId, ShopRepository shops) {
        String pinned = pinnedShop();
        if (pinned == null) return;
        Long own = shops.findBySlug(pinned.toLowerCase()).map(Shop::getId).orElse(-1L);
        if (recordShopId == null || !recordShopId.equals(own)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Élément introuvable dans votre boutique");
        }
    }
}
