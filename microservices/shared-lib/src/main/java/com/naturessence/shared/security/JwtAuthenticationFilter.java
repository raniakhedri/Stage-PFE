package com.naturessence.shared.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Stateless JWT filter — not annotated with {@code @Component} so that each
 * service can register it explicitly inside its own {@code SecurityConfig} bean,
 * allowing per-service placement in the filter chain.
 *
 * <p>Besides authenticating the caller it enforces two multi-tenant rules on the merchant APIs:
 * <ul>
 *   <li>a merchant or team member can only pass their own shop in {@code ?shop=};</li>
 *   <li>a team member (role created by the merchant) only reaches the modules their role grants.
 *       Such members also receive {@code ROLE_ADMIN}, so the existing {@code hasRole('ADMIN')}
 *       checks keep working and the module check below is what limits them.</li>
 * </ul>
 */
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    /** Path prefix → permission module(s), "A|B" meaning either. The first matching prefix wins. */
    private static final Map<String, String> MODULES = new LinkedHashMap<>();
    static {
        MODULES.put("/api/v1/admin/products", "PRODUITS");
        MODULES.put("/api/v1/admin/upload", "PRODUITS|BANNIERES|CATEGORIES|COLLECTIONS|APPARENCE");
        MODULES.put("/api/v1/admin/categories", "CATEGORIES");
        MODULES.put("/api/v1/admin/collections", "COLLECTIONS");
        MODULES.put("/api/v1/admin/orders", "COMMANDES");
        MODULES.put("/api/v1/admin/dashboard", "TABLEAU_DE_BORD");
        MODULES.put("/api/v1/admin/returns", "RETOURS");
        MODULES.put("/api/v1/admin/tva-shipping", "TVA_LIVRAISON");
        MODULES.put("/api/v1/admin/promotions", "PROMOTIONS");
        MODULES.put("/api/v1/admin/loyalty", "PROMOTIONS");
        MODULES.put("/api/v1/admin/segments", "PROMOTIONS|CLIENTS|EMAIL_MARKETING");
        MODULES.put("/api/v1/admin/banners", "BANNIERES");
        MODULES.put("/api/v1/admin/email", "EMAIL_MARKETING");
        MODULES.put("/api/v1/admin/reviews", "AVIS");
        MODULES.put("/api/v1/admin/appearance", "APPARENCE");
        MODULES.put("/api/v1/admin/store", "APPARENCE");
        MODULES.put("/api/v1/admin/roles", "ROLES_PERMISSIONS");
        MODULES.put("/api/v1/admin/users/team", "ROLES_PERMISSIONS");
        MODULES.put("/api/v1/admin/users", "CLIENTS");
        MODULES.put("/api/v1/analytics/behavior", "ANALYSES");
        MODULES.put("/api/v1/analytics/churn", "CLIENTS");
    }

    private final JwtUtil jwtUtil;

    public JwtAuthenticationFilter(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);

            // Only authenticate when the token is valid and no auth is present yet
            if (jwtUtil.isTokenValid(token)
                    && SecurityContextHolder.getContext().getAuthentication() == null) {

                Long userId     = jwtUtil.extractUserId(token);
                String role     = jwtUtil.extractRole(token);
                String shop     = jwtUtil.extractShop(token);
                List<String> perms = jwtUtil.extractPermissions(token);

                String denied = tenantViolation(request, role, shop, perms);
                if (denied != null) {
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.setContentType("application/json;charset=UTF-8");
                    response.getWriter().write("{\"message\":\"" + denied + "\"}");
                    return;
                }

                List<GrantedAuthority> authorities = new ArrayList<>();
                authorities.add(new SimpleGrantedAuthority("ROLE_" + role));
                if (perms != null) {
                    authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
                    authorities.add(new SimpleGrantedAuthority("ROLE_STAFF"));
                }

                UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(String.valueOf(userId), null, authorities);

                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);

                // Merchant APIs fall back to "all shops" when ?shop= is missing: pin it to the caller's shop.
                if (!PlatformRoles.isPlatform(role) && isMerchantApi(request.getRequestURI())) {
                    String pinned = shop == null ? "__aucune-boutique__" : shop;
                    request.setAttribute(TenantGuard.ATTRIBUTE, pinned);
                    request = new ShopScopedRequest(request, pinned);
                }
            }
        }

        filterChain.doFilter(request, response);
    }

    private static boolean isMerchantApi(String path) {
        return path.startsWith("/api/v1/admin/")
                || path.startsWith("/api/v1/analytics/behavior")
                || path.startsWith("/api/v1/analytics/churn");
    }

    /** Request whose {@code shop} parameter is always the caller's shop. */
    private static final class ShopScopedRequest extends jakarta.servlet.http.HttpServletRequestWrapper {
        private final String shop;

        ShopScopedRequest(HttpServletRequest request, String shop) {
            super(request);
            this.shop = shop;
        }

        @Override
        public String getParameter(String name) {
            return "shop".equals(name) ? shop : super.getParameter(name);
        }

        @Override
        public String[] getParameterValues(String name) {
            return "shop".equals(name) ? new String[] { shop } : super.getParameterValues(name);
        }

        @Override
        public Map<String, String[]> getParameterMap() {
            Map<String, String[]> map = new LinkedHashMap<>(super.getParameterMap());
            map.put("shop", new String[] { shop });
            return java.util.Collections.unmodifiableMap(map);
        }

        @Override
        public java.util.Enumeration<String> getParameterNames() {
            return java.util.Collections.enumeration(getParameterMap().keySet());
        }
    }

    /** Returns an error message when the request leaves the caller's shop or permissions, else null. */
    private String tenantViolation(HttpServletRequest request, String role, String shop, List<String> perms) {
        String path = request.getRequestURI();
        if (PlatformRoles.isPlatform(role)) {
            // The Sellio team runs the platform; a shop's customers, orders and analytics belong to the merchant.
            boolean allowed = !isMerchantApi(path)
                    || path.startsWith("/api/v1/admin/platform")
                    || path.startsWith("/api/v1/admin/roles")
                    || path.startsWith("/api/v1/admin/appearance");
            return allowed ? null : "L'équipe Sellio n'a pas accès aux données des boutiques.";
        }
        boolean merchantApi = isMerchantApi(path);
        if (merchantApi) {
            String requested = request.getParameter("shop");
            if (requested != null && !requested.isBlank()
                    && (shop == null || !shop.equalsIgnoreCase(requested.trim()))) {
                return "Accès refusé : cette boutique n'est pas la vôtre.";
            }
        }
        if (perms == null) return null;
        if (path.startsWith("/api/v1/auth/my-shop") && !"GET".equalsIgnoreCase(request.getMethod())
                && !perms.contains("APPARENCE")) {
            return "Votre rôle ne permet pas de modifier la boutique.";
        }
        if (!merchantApi) return null;
        for (Map.Entry<String, String> entry : MODULES.entrySet()) {
            if (path.startsWith(entry.getKey())) {
                for (String module : entry.getValue().split("\\|")) {
                    if (perms.contains(module)) return null;
                }
                return "Votre rôle ne donne pas accès à cette page.";
            }
        }
        return null;
    }
}
