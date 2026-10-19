package com.naturessence.auth.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.naturessence.shared.entity.RefreshToken;
import com.naturessence.shared.entity.User;
import com.naturessence.shared.repository.RefreshTokenRepository;
import java.time.Instant;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class RefreshTokenServiceTest {

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @InjectMocks
    private RefreshTokenService service;

    @BeforeEach
    void expiration() {
        ReflectionTestUtils.setField(service, "refreshExpiration", 3_600_000L);
    }

    @Test
    void createRefreshToken_replacesThePreviousSession() {
        User user = User.builder().id(4L).firstName("A").lastName("B").email("a@b.c").password("x").build();
        when(refreshTokenRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        RefreshToken token = service.createRefreshToken(user);

        verify(refreshTokenRepository).deleteByUserId(4L);
        assertThat(token.getToken()).matches("[0-9a-fA-F-]{36}");
        assertThat(token.getUser()).isSameAs(user);
        assertThat(token.getExpiryDate()).isAfter(Instant.now());
        assertThat(token.isExpired()).isFalse();
    }

    @Test
    void verifyRefreshToken_rejectsAnUnknownToken() {
        when(refreshTokenRepository.findByToken("missing")).thenReturn(java.util.Optional.empty());

        assertThatThrownBy(() -> service.verifyRefreshToken("missing"))
            .isInstanceOf(RuntimeException.class)
            .hasMessageContaining("invalide");
    }

    @Test
    void verifyRefreshToken_deletesAnExpiredToken() {
        User user = User.builder().id(4L).firstName("A").lastName("B").email("a@b.c").password("x").build();
        RefreshToken expired = RefreshToken.builder()
            .token("old")
            .user(user)
            .expiryDate(Instant.now().minusSeconds(5))
            .build();
        when(refreshTokenRepository.findByToken("old")).thenReturn(java.util.Optional.of(expired));

        assertThatThrownBy(() -> service.verifyRefreshToken("old"))
            .isInstanceOf(RuntimeException.class)
            .hasMessageContaining("expiré");
        verify(refreshTokenRepository).delete(expired);
    }

    @Test
    void deleteByUserId_delegatesToTheRepository() {
        service.deleteByUserId(4L);
        verify(refreshTokenRepository).deleteByUserId(4L);
    }
}
