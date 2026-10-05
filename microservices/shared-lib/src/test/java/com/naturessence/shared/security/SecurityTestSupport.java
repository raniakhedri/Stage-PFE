package com.naturessence.shared.security;

import com.naturessence.shared.entity.Permission;
import com.naturessence.shared.entity.Role;
import com.naturessence.shared.entity.User;
import com.naturessence.shared.enums.PermissionModule;
import org.springframework.test.util.ReflectionTestUtils;

/** Builds signed tokens for the security tests. */
final class SecurityTestSupport {

    static final String SECRET = "test-secret-key-that-is-long-enough-for-hs512-signatures-0123456789";

    private SecurityTestSupport() {
    }

    static JwtUtil jwtUtil() {
        JwtUtil jwt = new JwtUtil();
        ReflectionTestUtils.setField(jwt, "secret", SECRET);
        ReflectionTestUtils.setField(jwt, "accessExpiration", 60_000L);
        ReflectionTestUtils.setField(jwt, "refreshExpiration", 120_000L);
        return jwt;
    }

    static User user(long id, String roleName) {
        return User.builder().id(id).email("user" + id + "@sellio.test").role(Role.builder().name(roleName).label(roleName).build()).build();
    }

    /** A team member whose role (created by the merchant of shop 1) grants only the given modules. */
    static User staff(long id, PermissionModule... granted) {
        Role role = Role.builder().id(99L).name("S1_STAFF").label("Staff").shopId(1L).build();
        for (PermissionModule module : PermissionModule.values()) {
            boolean ok = java.util.Arrays.asList(granted).contains(module);
            role.addPermission(Permission.builder().module(module).granted(ok).build());
        }
        return User.builder().id(id).email("staff" + id + "@sellio.test").role(role).build();
    }
}
