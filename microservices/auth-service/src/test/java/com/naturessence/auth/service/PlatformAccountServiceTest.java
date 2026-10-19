package com.naturessence.auth.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.naturessence.shared.dto.response.UserResponse;
import com.naturessence.shared.entity.Role;
import com.naturessence.shared.entity.Segment;
import com.naturessence.shared.entity.User;
import com.naturessence.shared.enums.AccountStatus;
import com.naturessence.shared.repository.RoleRepository;
import com.naturessence.shared.repository.SegmentRepository;
import com.naturessence.shared.repository.ShopRepository;
import com.naturessence.shared.repository.UserRepository;
import com.naturessence.shared.security.PlatformRoles;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class PlatformAccountServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private RoleRepository roleRepository;
    @Mock private SegmentRepository segmentRepository;
    @Mock private ShopRepository shopRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private EmailService emailService;
    @Mock private AuthService authService;
    @Mock private JdbcTemplate jdbc;

    @InjectMocks
    private PlatformAccountService service;

    @Test
    void createAdmin_isReservedToTheSuperAdmin() {
        assertThatThrownBy(() -> service.createAdmin(user("SELLIO_ADMIN", null), "Ada", "L", "ada@example.com", "SELLIO_ADMIN"))
            .isInstanceOf(ResponseStatusException.class);
        verify(userRepository, never()).save(any());
    }

    @Test
    void createAdmin_rejectsAMerchantRoleAndATakenEmail() {
        User caller = user(PlatformRoles.SUPER_ADMIN, null);
        assertThatThrownBy(() -> service.createAdmin(caller, "Ada", "L", "ada@example.com", "ADMIN"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("SELLIO_ADMIN");

        when(userRepository.accountEmailTaken("ada@example.com")).thenReturn(true);
        assertThatThrownBy(() -> service.createAdmin(caller, "Ada", "L", "Ada@Example.com", "SELLIO_ADMIN"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("déjà");
    }

    @Test
    void createAdmin_savesAOneTimePasswordAndEmailsIt() {
        User caller = user(PlatformRoles.SUPER_ADMIN, null);
        when(userRepository.accountEmailTaken("ada@example.com")).thenReturn(false);
        when(segmentRepository.findByName("NOUVEAU")).thenReturn(Optional.of(Segment.builder().name("NOUVEAU").label("Nouveau").build()));
        when(roleRepository.findByName("SELLIO_ADMIN")).thenReturn(Optional.of(Role.builder().name("SELLIO_ADMIN").label("Admin").build()));
        when(passwordEncoder.encode(anyString())).thenReturn("hashed");
        when(userRepository.save(any())).thenAnswer(invocation -> {
            User saved = invocation.getArgument(0);
            saved.setId(9L);
            return saved;
        });
        when(authService.mapToUserResponse(any())).thenReturn(UserResponse.builder().id(9L).email("ada@example.com").build());

        UserResponse created = service.createAdmin(caller, " Ada ", "Lovelace", "Ada@Example.com", null);

        assertThat(created.getEmail()).isEqualTo("ada@example.com");
        verify(emailService).sendAccountInvite(any(), anyString(), eq(null), eq(null), eq(true));
    }

    @Test
    void changeRole_refusesSelfChangeAndAMerchantWhoStillOwnsAShop() {
        User caller = user(PlatformRoles.SUPER_ADMIN, null);
        caller.setId(1L);
        when(userRepository.findById(1L)).thenReturn(Optional.of(caller));
        assertThatThrownBy(() -> service.changeRole(caller, 1L, "SELLIO_ADMIN"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("propre");

        User merchant = user("ADMIN", 3L);
        merchant.setId(8L);
        when(userRepository.findById(8L)).thenReturn(Optional.of(merchant));
        assertThatThrownBy(() -> service.changeRole(caller, 8L, "SELLIO_ADMIN"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("boutique");
    }

    @Test
    void deleteAccount_refusesTheCallerThemselves() {
        User caller = user(PlatformRoles.SUPER_ADMIN, null);
        caller.setId(1L);
        when(userRepository.findById(1L)).thenReturn(Optional.of(caller));

        assertThatThrownBy(() -> service.deleteAccount(caller, 1L))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("propre");
    }

    @Test
    void accounts_mapsManagedUsers() {
        User admin = user(PlatformRoles.SELLIO_ADMIN, null);
        when(userRepository.findByRoleNames(List.of(PlatformRoles.MERCHANT, PlatformRoles.SELLIO_ADMIN, PlatformRoles.SUPER_ADMIN)))
            .thenReturn(List.of(admin));
        when(authService.mapToUserResponse(admin)).thenReturn(UserResponse.builder().email("s@example.com").build());

        assertThat(service.accounts()).extracting(UserResponse::getEmail).containsExactly("s@example.com");
    }

    private static User user(String role, Long shopId) {
        return User.builder()
            .id(1L)
            .shopId(shopId)
            .firstName("Sam")
            .lastName("Test")
            .email("s@example.com")
            .password("x")
            .status(AccountStatus.ACTIVE)
            .role(Role.builder().name(role).label(role).shopId(null).build())
            .build();
    }
}
