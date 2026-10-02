package com.naturessence.shared.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * Id of the signed-in account. The JWT filter uses the user id as the authentication name, because an
 * e-mail is not enough to identify a customer: the same address can have an account in several shops.
 */
public final class CurrentUser {

    private CurrentUser() {}

    public static Long id(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) return null;
        String name = authentication.getName();
        if (name == null || "anonymousUser".equals(name)) return null;
        try {
            return Long.valueOf(name);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    public static Long id() {
        return id(SecurityContextHolder.getContext().getAuthentication());
    }
}
