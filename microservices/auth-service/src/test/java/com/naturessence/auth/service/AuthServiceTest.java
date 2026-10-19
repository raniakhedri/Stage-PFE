package com.naturessence.auth.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.naturessence.shared.dto.request.LoginRequest;
import com.naturessence.shared.dto.request.RegisterRequest;
import com.naturessence.shared.dto.response.AuthResponse;
import com.naturessence.shared.entity.AuthCode;
import com.naturessence.shared.entity.RefreshToken;
import com.naturessence.shared.entity.Role;
import com.naturessence.shared.entity.Shop;
import com.naturessence.shared.entity.User;
import com.naturessence.shared.enums.AccountStatus;
import com.naturessence.shared.repository.RoleRepository;
import com.naturessence.shared.repository.SegmentRepository;
import com.naturessence.shared.repository.ShopRepository;
import com.naturessence.shared.repository.UserRepository;
import com.naturessence.shared.security.JwtUtil;
import java.time.Instant;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private RoleRepository roleRepository;
    @Mock private SegmentRepository segmentRepository;
    @Mock private ShopRepository shopRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtUtil jwtUtil;
    @Mock private RefreshTokenService refreshTokenService;
    @Mock private LoyaltyService loyaltyService;
    @Mock private MerchantVerificationService verificationService;
    @Mock private AuthCodeService authCodeService;
    @Mock private EmailService emailService;

    @InjectMocks
    private AuthService service;

    private User merchant;

    @BeforeEach
    void user() {
        merchant = User.builder()
            .id(4L)
            .firstName("Rania")
            .lastName("Test")
            .email("rania@example.com")
            .password("hash")
            .status(AccountStatus.ACTIVE)
            .role(Role.builder().name("ADMIN").label("Marchand").build())
            .build();
    }

    @Test
    void register_requiresAShop() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("a@example.com");
        request.setPassword("password1");
        request.setFirstName("A");
        request.setLastName("B");

        assertThatThrownBy(() -> service.register(request))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("boutique");
    }

    @Test
    void register_rejectsAnEmailAlreadyUsedInThatShop() {
        RegisterRequest request = new RegisterRequest();
        request.setShopSlug("Demo");
        request.setEmail("A@Example.com");
        request.setPassword("password1");
        Shop shop = Shop.builder().id(3L).name("Demo").slug("demo").build();
        when(shopRepository.findBySlug("demo")).thenReturn(Optional.of(shop));
        when(userRepository.clientEmailTaken("A@Example.com", 3L)).thenReturn(true);

        assertThatThrownBy(() -> service.register(request))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("déjà");
    }

    @Test
    void login_returnsTokensForTheRightPassword() {
        LoginRequest request = new LoginRequest();
        request.setEmail("Rania@Example.com");
        request.setPassword("secret");
        when(userRepository.findAccountByEmail("rania@example.com")).thenReturn(Optional.of(merchant));
        when(passwordEncoder.matches("secret", "hash")).thenReturn(true);
        when(userRepository.save(merchant)).thenReturn(merchant);
        when(refreshTokenService.createRefreshToken(merchant)).thenReturn(
            RefreshToken.builder().token("refresh-1").user(merchant).expiryDate(Instant.now().plusSeconds(60)).build()
        );
        when(jwtUtil.generateAccessToken(merchant, null)).thenReturn("access-1");

        AuthResponse response = service.login(request);

        assertThat(response.getAccessToken()).isEqualTo("access-1");
        assertThat(response.getRefreshToken()).isEqualTo("refresh-1");
        assertThat(response.getUser().getEmail()).isEqualTo("rania@example.com");
        assertThat(response.getUser().getPermissions()).containsEntry("PRODUITS", true);
        assertThat(merchant.getLastLogin()).isNotNull();
    }

    @Test
    void login_rejectsAWrongPasswordAndABlockedAccount() {
        LoginRequest request = new LoginRequest();
        request.setEmail("rania@example.com");
        request.setPassword("nope");
        when(userRepository.findAccountByEmail("rania@example.com")).thenReturn(Optional.of(merchant));
        when(passwordEncoder.matches("nope", "hash")).thenReturn(false);

        assertThatThrownBy(() -> service.login(request)).isInstanceOf(BadCredentialsException.class);

        merchant.setStatus(AccountStatus.BLOCKED);
        when(passwordEncoder.matches("nope", "hash")).thenReturn(true);
        assertThatThrownBy(() -> service.login(request)).isInstanceOf(LockedException.class);
    }

    @Test
    void login_unknownStorefrontShopDoesNotRevealTheAccount() {
        LoginRequest request = new LoginRequest();
        request.setEmail("rania@example.com");
        request.setPassword("secret");
        request.setShopSlug("missing");
        when(shopRepository.findBySlug("missing")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.login(request)).isInstanceOf(BadCredentialsException.class);
        verify(passwordEncoder, never()).matches(anyString(), anyString());
    }

    @Test
    void forgotPassword_staysSilentWhenThereIsNoAccount() {
        service.forgotPassword("nobody@example.com", null);

        verify(emailService, never()).sendPasswordResetCode(any(), any(), any());
    }

    @Test
    void forgotPassword_emailsACodeForAnActiveAccount() {
        when(userRepository.findAccountByEmail("rania@example.com")).thenReturn(Optional.of(merchant));
        when(authCodeService.issue("rania@example.com", AuthCode.RESET, null)).thenReturn("123456");

        service.forgotPassword(" Rania@Example.com ", null);

        verify(emailService).sendPasswordResetCode(merchant, "123456", null);
    }

    @Test
    void changePassword_rejectsTheCurrentPasswordAndAShortReplacement() {
        when(userRepository.findById(4L)).thenReturn(Optional.of(merchant));
        when(passwordEncoder.matches("wrong", "hash")).thenReturn(false);

        assertThatThrownBy(() -> service.changePassword(4L, "wrong", "long-enough"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("actuel");

        when(passwordEncoder.matches("secret", "hash")).thenReturn(true);
        assertThatThrownBy(() -> service.changePassword(4L, "secret", "short"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("8");
    }

    @Test
    void resetPassword_storesTheNewHashAndDropsSessions() {
        when(passwordEncoder.encode("new-secret")).thenReturn("new-hash");
        when(userRepository.findAccountByEmail("rania@example.com")).thenReturn(Optional.of(merchant));

        service.resetPassword("rania@example.com", "123456", "new-secret", null);

        verify(authCodeService).consume("rania@example.com", AuthCode.RESET, "123456");
        assertThat(merchant.getPassword()).isEqualTo("new-hash");
        assertThat(merchant.getMustChangePassword()).isFalse();
        verify(refreshTokenService).deleteByUserId(4L);
    }

    @Test
    void startMerchantSignup_rejectsATakenEmailAndAWeakPassword() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("taken@example.com");
        request.setPassword("password1");
        request.setFirstName("A");
        when(userRepository.accountEmailTaken("taken@example.com")).thenReturn(true);

        assertThatThrownBy(() -> service.startMerchantSignup(request))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("déjà");

        request.setEmail("new@example.com");
        request.setPassword("short");
        when(userRepository.accountEmailTaken("new@example.com")).thenReturn(false);
        assertThatThrownBy(() -> service.startMerchantSignup(request))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("8");
    }

    @Test
    void logout_deletesRefreshTokens() {
        service.logout(4L);
        verify(refreshTokenService).deleteByUserId(4L);
    }

    @Test
    void mapToUserResponse_withoutRole_throwsNullPointerException() {
        User orphan = User.builder().id(1L).firstName("A").lastName("B").email("a@b.c").password("x").build();

        assertThatThrownBy(() -> service.mapToUserResponse(orphan)).isInstanceOf(NullPointerException.class);
    }

    @Test
    void refreshToken_refusesAnInactiveAccount() {
        merchant.setStatus(AccountStatus.INACTIVE);
        when(refreshTokenService.verifyRefreshToken("tok")).thenReturn(
            RefreshToken.builder().token("tok").user(merchant).expiryDate(Instant.now().plusSeconds(30)).build()
        );

        assertThatThrownBy(() -> service.refreshToken("tok")).isInstanceOf(LockedException.class);
    }

    @Test
    void myShop_requiresAnExistingShop() {
        when(userRepository.findById(4L)).thenReturn(Optional.of(merchant));

        assertThatThrownBy(() -> service.myShop(4L))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("pas encore");
    }
}
