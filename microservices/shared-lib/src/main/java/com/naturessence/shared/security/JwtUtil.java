package com.naturessence.shared.security;

import com.naturessence.shared.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.access.expiration:86400000}")
    private long accessExpiration;

    @Value("${jwt.refresh.expiration:604800000}")
    private long refreshExpiration;

    /**
     * Generates a signed HS256 access token containing the user's email (subject),
     * role name, and database ID as claims.
     */
    public String generateAccessToken(User user) {
        return generateAccessToken(user, null);
    }

    /**
     * Same as {@link #generateAccessToken(User)}, plus the tenant: the shop slug (so every service can
     * refuse {@code ?shop=} values that are not the caller's own shop) and, for team members whose role
     * was created by the merchant, the list of modules that role grants.
     */
    public String generateAccessToken(User user, String shopSlug) {
        var builder = Jwts.builder()
            .subject(user.getEmail())
            .claim("role", user.getRole().getName())
            .claim("userId", user.getId())
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + accessExpiration));
        if (shopSlug != null) builder.claim("shop", shopSlug);
        if (user.getRole().getShopId() != null) {
            List<String> granted = new ArrayList<>();
            user.getRole().getPermissions().forEach(p -> {
                if (p.isGranted()) granted.add(p.getModule().name());
            });
            builder.claim("perms", granted);
        }
        return builder.signWith(getSecretKey()).compact();
    }

    /** Shop slug of the caller, or null for platform accounts. */
    public String extractShop(String token) {
        return extractAllClaims(token).get("shop", String.class);
    }

    /** Modules granted to a team member; null for owners, platform admins and customers (no restriction). */
    @SuppressWarnings("unchecked")
    public List<String> extractPermissions(String token) {
        Object raw = extractAllClaims(token).get("perms");
        if (!(raw instanceof List<?> list)) return null;
        List<String> out = new ArrayList<>();
        list.forEach(v -> out.add(String.valueOf(v)));
        return out;
    }

    /**
     * Generates a minimal refresh token containing only the subject (email).
     * Longer-lived; does not carry role or userId to limit blast radius if leaked.
     */
    public String generateRefreshToken(String email) {
        return Jwts.builder()
            .subject(email)
            .issuedAt(new Date())
            .expiration(
                new Date(System.currentTimeMillis() + refreshExpiration)
            )
            .signWith(getSecretKey())
            .compact();
    }

    /** Returns the email stored in the token's subject claim. */
    public String extractUsername(String token) {
        return extractAllClaims(token).getSubject();
    }

    /** Returns the "role" custom claim (e.g. "ADMIN", "CLIENT"). */
    public String extractRole(String token) {
        return extractAllClaims(token).get("role", String.class);
    }

    /** Returns the "userId" custom claim. */
    public Long extractUserId(String token) {
        // jjwt deserialises numeric claims as Integer when the value fits;
        // cast via Number to handle both Integer and Long gracefully.
        Object raw = extractAllClaims(token).get("userId");
        if (raw instanceof Number n) {
            return n.longValue();
        }
        return null;
    }

    /**
     * Returns {@code true} only when the token has a valid signature,
     * is not malformed, and has not expired. Never propagates exceptions.
     */
    public boolean isTokenValid(String token) {
        try {
            Claims claims = extractAllClaims(token);
            return claims.getExpiration().after(new Date());
        } catch (Exception e) {
            return false;
        }
    }

    // ── Internals ────────────────────────────────────────────────────────────

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
            .verifyWith(getSecretKey())
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }

    // Uses raw UTF-8 bytes so the jwt.secret property can be any plain-text
    // string of ≥ 32 characters — no Base64 encoding required in properties files.
    private SecretKey getSecretKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }
}
