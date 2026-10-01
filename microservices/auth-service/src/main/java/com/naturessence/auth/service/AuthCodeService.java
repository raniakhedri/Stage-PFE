package com.naturessence.auth.service;

import com.naturessence.shared.entity.AuthCode;
import com.naturessence.shared.repository.AuthCodeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HexFormat;

/** Six-digit e-mail codes: 10-minute lifetime, 5 attempts, one new code per minute. */
@Service
@RequiredArgsConstructor
public class AuthCodeService {

    private static final int TTL_MINUTES = 10;
    private static final int MAX_ATTEMPTS = 5;
    private static final int RESEND_COOLDOWN_SECONDS = 60;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final AuthCodeRepository repository;

    /** Replaces any previous code for this e-mail and purpose, and returns the new plain code. */
    @Transactional(noRollbackFor = IllegalArgumentException.class)
    public String issue(String email, String purpose, String payload) {
        String key = email.trim().toLowerCase();
        repository.findTopByEmailAndPurposeOrderByCreatedAtDesc(key, purpose).ifPresent(last -> {
            if (last.getCreatedAt() != null
                    && last.getCreatedAt().isAfter(LocalDateTime.now().minusSeconds(RESEND_COOLDOWN_SECONDS))) {
                throw new IllegalArgumentException("Un code vient d'être envoyé. Patientez une minute avant d'en demander un autre.");
            }
        });
        repository.deleteAllFor(key, purpose);
        String code = String.format("%06d", RANDOM.nextInt(1_000_000));
        repository.save(AuthCode.builder()
                .email(key)
                .purpose(purpose)
                .codeHash(hash(code))
                .payload(payload)
                .expiresAt(LocalDateTime.now().plusMinutes(TTL_MINUTES))
                .build());
        return code;
    }

    /** Checks the code and consumes it. Returns the stored entry (with its payload). */
    @Transactional(noRollbackFor = IllegalArgumentException.class)
    public AuthCode consume(String email, String purpose, String code) {
        String key = email == null ? "" : email.trim().toLowerCase();
        AuthCode entry = repository.findTopByEmailAndPurposeOrderByCreatedAtDesc(key, purpose)
                .orElseThrow(() -> new IllegalArgumentException("Code invalide ou expiré. Demandez un nouveau code."));
        if (entry.getExpiresAt().isBefore(LocalDateTime.now())) {
            repository.delete(entry);
            throw new IllegalArgumentException("Ce code a expiré. Demandez un nouveau code.");
        }
        if (entry.getAttempts() >= MAX_ATTEMPTS) {
            repository.delete(entry);
            throw new IllegalArgumentException("Trop d'essais. Demandez un nouveau code.");
        }
        if (code == null || !MessageDigest.isEqual(hash(code.trim()).getBytes(StandardCharsets.UTF_8),
                entry.getCodeHash().getBytes(StandardCharsets.UTF_8))) {
            entry.setAttempts(entry.getAttempts() + 1);
            repository.save(entry);
            int left = MAX_ATTEMPTS - entry.getAttempts();
            throw new IllegalArgumentException(left > 0
                    ? "Code incorrect. Il vous reste " + left + " essai" + (left > 1 ? "s" : "") + "."
                    : "Trop d'essais. Demandez un nouveau code.");
        }
        repository.delete(entry);
        return entry;
    }

    /** The pending entry, without consuming it (used to resend a sign-up code with the same data). */
    public AuthCode pending(String email, String purpose) {
        return repository.findTopByEmailAndPurposeOrderByCreatedAtDesc(email.trim().toLowerCase(), purpose)
                .orElseThrow(() -> new IllegalArgumentException("Aucune inscription en attente pour cet e-mail. Recommencez."));
    }

    private static String hash(String code) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(code.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}
