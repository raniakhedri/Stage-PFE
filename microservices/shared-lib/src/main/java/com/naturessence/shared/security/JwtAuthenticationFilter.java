package com.naturessence.shared.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Stateless JWT filter — not annotated with {@code @Component} so that each
 * service can register it explicitly inside its own {@code SecurityConfig} bean,
 * allowing per-service placement in the filter chain.
 *
 * <p>Typical usage in a service's SecurityConfig:
 * <pre>{@code
 * @Bean
 * public JwtAuthenticationFilter jwtAuthenticationFilter() {
 *     return new JwtAuthenticationFilter(jwtUtil);
 * }
 * }</pre>
 */
public class JwtAuthenticationFilter extends OncePerRequestFilter {

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

                String username = jwtUtil.extractUsername(token);
                String role     = jwtUtil.extractRole(token);

                UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(
                                username,
                                null,
                                List.of(new SimpleGrantedAuthority("ROLE_" + role))
                        );

                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }

        filterChain.doFilter(request, response);
    }
}
