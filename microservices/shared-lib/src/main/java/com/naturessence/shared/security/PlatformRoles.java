package com.naturessence.shared.security;

import java.util.Set;

/**
 * Account roles that are not tied to a shop.
 * <ul>
 *   <li>{@code SUPER_ADMIN}: owns the platform, adds Sellio admins and changes account roles;</li>
 *   <li>{@code SELLIO_ADMIN}: runs the Sellio console (verifications, suspensions, deleting merchants).</li>
 * </ul>
 * Neither can read a shop's customers, orders or analytics: they only work through {@code /admin/platform}.
 * {@code ADMIN} is the merchant who owns a shop, {@code CLIENT} a shop's customer.
 */
public final class PlatformRoles {

    public static final String SUPER_ADMIN = "SUPER_ADMIN";
    public static final String SELLIO_ADMIN = "SELLIO_ADMIN";
    public static final String MERCHANT = "ADMIN";
    public static final String CLIENT = "CLIENT";

    /** Roles a super admin can give from the console. */
    public static final Set<String> ASSIGNABLE = Set.of(SUPER_ADMIN, SELLIO_ADMIN, MERCHANT);

    private PlatformRoles() {}

    public static boolean isPlatform(String role) {
        return SUPER_ADMIN.equals(role) || SELLIO_ADMIN.equals(role);
    }
}
