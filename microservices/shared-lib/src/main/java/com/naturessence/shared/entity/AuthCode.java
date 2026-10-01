package com.naturessence.shared.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Six-digit code sent by e-mail: merchant sign-up verification (SIGNUP) or password reset (RESET).
 * Only a SHA-256 hash of the code is stored. For SIGNUP, {@code payload} holds the pending
 * registration (with the password already BCrypt-hashed) until the code is confirmed.
 */
@Entity
@Table(name = "auth_codes", indexes = @Index(name = "idx_auth_codes_email_purpose", columnList = "email, purpose"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthCode {

    public static final String SIGNUP = "SIGNUP";
    public static final String RESET = "RESET";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false, length = 20)
    private String purpose;

    @Column(nullable = false, length = 64)
    private String codeHash;

    @Column(columnDefinition = "TEXT")
    private String payload;

    @Builder.Default
    private int attempts = 0;

    @Column(nullable = false)
    private LocalDateTime expiresAt;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
