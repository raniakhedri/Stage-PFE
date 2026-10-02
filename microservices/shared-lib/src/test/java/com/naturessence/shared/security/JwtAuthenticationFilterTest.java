package com.naturessence.shared.security;

import com.naturessence.shared.entity.User;
import com.naturessence.shared.enums.PermissionModule;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import static org.assertj.core.api.Assertions.assertThat;

/** Multi-tenant rules enforced on every service: shop isolation, team permissions, Sellio team scope. */
class JwtAuthenticationFilterTest {

    private final JwtUtil jwt = SecurityTestSupport.jwtUtil();
    private final JwtAuthenticationFilter filter = new JwtAuthenticationFilter(jwt);

    @AfterEach
    void clear() {
        SecurityContextHolder.clearContext();
    }

    private record Result(int status, HttpServletRequest forwarded, Authentication auth) {}

    private Result call(User user, String shop, String method, String path, String shopParam) throws Exception {
        SecurityContextHolder.clearContext();
        MockHttpServletRequest request = new MockHttpServletRequest(method, path);
        request.setRequestURI(path);
        if (shopParam != null) request.setParameter("shop", shopParam);
        request.addHeader("Authorization", "Bearer " + jwt.generateAccessToken(user, shop));
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();
        filter.doFilter(request, response, chain);
        return new Result(response.getStatus(), (HttpServletRequest) chain.getRequest(),
                SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void merchantCannotReadAnotherShop() throws Exception {
        Result r = call(SecurityTestSupport.user(5, "ADMIN"), "shop-a", "GET", "/api/v1/admin/products", "shop-b");
        assertThat(r.status()).isEqualTo(403);
        assertThat(r.forwarded()).isNull();
    }

    @Test
    void merchantRequestsArePinnedToTheirShop() throws Exception {
        Result r = call(SecurityTestSupport.user(5, "ADMIN"), "shop-a", "GET", "/api/v1/admin/products", null);
        assertThat(r.status()).isEqualTo(200);
        assertThat(r.forwarded().getParameter("shop")).isEqualTo("shop-a");
        assertThat(r.forwarded().getAttribute(TenantGuard.ATTRIBUTE)).isEqualTo("shop-a");
        // The authentication name is the user id: an e-mail can belong to customers of several shops.
        assertThat(r.auth().getName()).isEqualTo("5");
        assertThat(CurrentUser.id(r.auth())).isEqualTo(5L);
    }

    @Test
    void teamMemberOnlyReachesGrantedModules() throws Exception {
        User staff = SecurityTestSupport.staff(8, PermissionModule.COMMANDES);
        assertThat(call(staff, "shop-a", "GET", "/api/v1/admin/orders", null).status()).isEqualTo(200);
        assertThat(call(staff, "shop-a", "GET", "/api/v1/admin/products", null).status()).isEqualTo(403);
        assertThat(call(staff, "shop-a", "PATCH", "/api/v1/auth/my-shop", null).status()).isEqualTo(403);
    }

    @Test
    void sellioTeamHasNoAccessToShopData() throws Exception {
        for (String role : new String[] {"SUPER_ADMIN", "SELLIO_ADMIN"}) {
            User admin = SecurityTestSupport.user(1, role);
            assertThat(call(admin, null, "GET", "/api/v1/admin/users", "shop-a").status()).as(role + " customers").isEqualTo(403);
            assertThat(call(admin, null, "GET", "/api/v1/admin/orders", "shop-a").status()).as(role + " orders").isEqualTo(403);
            assertThat(call(admin, null, "GET", "/api/v1/analytics/churn", "shop-a").status()).as(role + " churn").isEqualTo(403);
            assertThat(call(admin, null, "GET", "/api/v1/admin/platform/shops", null).status()).as(role + " console").isEqualTo(200);
        }
    }

    @Test
    void invalidTokenLeavesTheRequestAnonymous() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/admin/products");
        request.setRequestURI("/api/v1/admin/products");
        request.addHeader("Authorization", "Bearer forged.token.value");
        MockFilterChain chain = new MockFilterChain();
        filter.doFilter(request, new MockHttpServletResponse(), chain);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        assertThat(chain.getRequest()).isNotNull();
    }
}
