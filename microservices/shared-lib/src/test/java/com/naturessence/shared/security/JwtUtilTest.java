package com.naturessence.shared.security;

import com.naturessence.shared.enums.PermissionModule;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;

class JwtUtilTest {

    private final JwtUtil jwt = SecurityTestSupport.jwtUtil();

    @Test
    void accessTokenCarriesUserRoleAndShop() {
        String token = jwt.generateAccessToken(SecurityTestSupport.user(42, "ADMIN"), "ma-boutique");

        assertThat(jwt.isTokenValid(token)).isTrue();
        assertThat(jwt.extractUserId(token)).isEqualTo(42L);
        assertThat(jwt.extractRole(token)).isEqualTo("ADMIN");
        assertThat(jwt.extractShop(token)).isEqualTo("ma-boutique");
        // An owner has every module: no permission list in the token.
        assertThat(jwt.extractPermissions(token)).isNull();
    }

    @Test
    void teamMemberTokenListsOnlyGrantedModules() {
        String token = jwt.generateAccessToken(SecurityTestSupport.staff(7, PermissionModule.COMMANDES, PermissionModule.RETOURS), "ma-boutique");

        assertThat(jwt.extractPermissions(token)).containsExactlyInAnyOrder("COMMANDES", "RETOURS");
    }

    @Test
    void rejectsTokensSignedWithAnotherKeyOrTampered() {
        JwtUtil other = SecurityTestSupport.jwtUtil();
        ReflectionTestUtils.setField(other, "secret", "another-secret-key-that-is-long-enough-for-hs512-signatures-xyz");
        String foreign = other.generateAccessToken(SecurityTestSupport.user(1, "SUPER_ADMIN"));
        String token = jwt.generateAccessToken(SecurityTestSupport.user(1, "CLIENT"));

        assertThat(jwt.isTokenValid(foreign)).isFalse();
        assertThat(jwt.isTokenValid(token.substring(0, token.length() - 3) + "abc")).isFalse();
        assertThat(jwt.isTokenValid("not-a-token")).isFalse();
    }

    @Test
    void rejectsExpiredTokens() {
        ReflectionTestUtils.setField(jwt, "accessExpiration", -1_000L);
        assertThat(jwt.isTokenValid(jwt.generateAccessToken(SecurityTestSupport.user(1, "ADMIN")))).isFalse();
    }
}
