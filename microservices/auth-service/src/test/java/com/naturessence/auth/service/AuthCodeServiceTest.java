package com.naturessence.auth.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.naturessence.shared.entity.AuthCode;
import com.naturessence.shared.repository.AuthCodeRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AuthCodeServiceTest {

    @Mock
    private AuthCodeRepository repository;

    @InjectMocks
    private AuthCodeService service;

    @Test
    void issue_rejectsASecondCodeInsideTheCooldown() {
        AuthCode recent = AuthCode.builder()
            .email("ada@example.com")
            .purpose(AuthCode.SIGNUP)
            .createdAt(LocalDateTime.now())
            .expiresAt(LocalDateTime.now().plusMinutes(10))
            .build();
        when(repository.findTopByEmailAndPurposeOrderByCreatedAtDesc("ada@example.com", AuthCode.SIGNUP))
            .thenReturn(Optional.of(recent));

        assertThatThrownBy(() -> service.issue(" Ada@Example.com ", AuthCode.SIGNUP, "{}"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("minute");
    }

    @Test
    void issueThenConsume_acceptsThePlainCodeAndDeletesIt() {
        when(repository.findTopByEmailAndPurposeOrderByCreatedAtDesc("ada@example.com", AuthCode.RESET))
            .thenReturn(Optional.empty());
        String code = service.issue("ada@example.com", AuthCode.RESET, null);

        ArgumentCaptor<AuthCode> saved = ArgumentCaptor.forClass(AuthCode.class);
        verify(repository).save(saved.capture());
        assertThat(code).matches("\\d{6}");
        assertThat(saved.getValue().getCodeHash()).isEqualTo(hash(code));
        assertThat(saved.getValue().getEmail()).isEqualTo("ada@example.com");

        when(repository.findTopByEmailAndPurposeOrderByCreatedAtDesc("ada@example.com", AuthCode.RESET))
            .thenReturn(Optional.of(saved.getValue()));

        AuthCode consumed = service.consume(" ADA@example.com ", AuthCode.RESET, code);

        assertThat(consumed).isSameAs(saved.getValue());
        verify(repository).delete(saved.getValue());
    }

    @Test
    void consume_countsAWrongCodeAndReportsAttemptsLeft() {
        AuthCode entry = AuthCode.builder()
            .email("ada@example.com")
            .purpose(AuthCode.RESET)
            .codeHash(hash("111111"))
            .expiresAt(LocalDateTime.now().plusMinutes(5))
            .attempts(3)
            .build();
        when(repository.findTopByEmailAndPurposeOrderByCreatedAtDesc("ada@example.com", AuthCode.RESET))
            .thenReturn(Optional.of(entry));

        assertThatThrownBy(() -> service.consume("ada@example.com", AuthCode.RESET, "000000"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("1 essai");
        assertThat(entry.getAttempts()).isEqualTo(4);
        verify(repository).save(entry);
    }

    @Test
    void consume_deletesAnExpiredCode() {
        AuthCode entry = AuthCode.builder()
            .email("ada@example.com")
            .purpose(AuthCode.SIGNUP)
            .codeHash(hash("111111"))
            .expiresAt(LocalDateTime.now().minusMinutes(1))
            .build();
        when(repository.findTopByEmailAndPurposeOrderByCreatedAtDesc("ada@example.com", AuthCode.SIGNUP))
            .thenReturn(Optional.of(entry));

        assertThatThrownBy(() -> service.consume("ada@example.com", AuthCode.SIGNUP, "111111"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("expiré");
        verify(repository).delete(entry);
    }

    @Test
    void pending_requiresAnExistingSignup() {
        when(repository.findTopByEmailAndPurposeOrderByCreatedAtDesc("ada@example.com", AuthCode.SIGNUP))
            .thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.pending("ada@example.com", AuthCode.SIGNUP))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("inscription");
    }

    private static String hash(String code) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(code.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}
