package com.naturessence.analytics;

import com.naturessence.shared.entity.Shop;
import com.naturessence.shared.entity.User;
import com.naturessence.shared.repository.ShopRepository;
import com.naturessence.shared.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

/** Resolves the shop behind a request and checks who may read its analytics. */
@Component
@RequiredArgsConstructor
public class ShopAccess {

    private final ShopRepository shopRepository;
    private final UserRepository userRepository;

    public Shop bySlug(String slug) {
        if (slug == null || slug.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Paramètre shop manquant");
        }
        return shopRepository.findBySlug(slug.trim())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Boutique introuvable"));
    }

    /** Logged-in user (any role) or null for anonymous visitors. */
    public User currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth.getName() == null || "anonymousUser".equals(auth.getName())) {
            return null;
        }
        return userRepository.findByEmailIgnoreCase(auth.getName()).orElse(null);
    }

    /** A merchant reads only their own shop; the Sellio platform admin reads every shop. */
    public Shop forAdmin(String slug) {
        Shop shop = bySlug(slug);
        User user = currentUser();
        if (user == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        String role = user.getRole() != null ? user.getRole().getName() : "";
        if ("SUPER_ADMIN".equals(role)) return shop;
        if (!shop.getId().equals(user.getShopId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cette boutique ne vous appartient pas");
        }
        return shop;
    }
}
