package com.naturessence.shared.security;

import com.naturessence.shared.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.util.Date;
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
        return Jwts.builder()
            .subject(user.getEmail())
            .claim("role", user.getRole().getName())
            .claim("userId", user.getId())
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + accessExpiration))
            .signWith(getSecretKey())
            .compact();
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
