package com.naturessence.auth.service;

import com.naturessence.shared.entity.RefreshToken;
import com.naturessence.shared.entity.User;
import com.naturessence.shared.repository.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;

    @Value("${jwt.refresh.expiration:604800000}")
    private long refreshExpiration;

    @Transactional
    public RefreshToken createRefreshToken(User user) {
        // Invalidate any existing tokens for this user (single-session policy)
        refreshTokenRepository.deleteByUserId(user.getId());

        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .token(UUID.randomUUID().toString())
                .expiryDate(Instant.now().plusMillis(refreshExpiration))
                .build();

        return refreshTokenRepository.save(refreshToken);
    }

    public RefreshToken verifyRefreshToken(String token) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Refresh token invalide"));

        if (refreshToken.isExpired()) {
            refreshTokenRepository.delete(refreshToken);
            throw new RuntimeException("Refresh token expiré. Veuillez vous reconnecter.");
        }

        return refreshToken;
    }

    @Transactional
    public void deleteByUserId(Long userId) {
        refreshTokenRepository.deleteByUserId(userId);
    }
}
