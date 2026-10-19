package com.naturessence.auth.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.naturessence.auth.security.UserPrincipal;
import com.naturessence.shared.entity.Role;
import com.naturessence.shared.entity.User;
import com.naturessence.shared.repository.UserRepository;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

@ExtendWith(MockitoExtension.class)
class CustomUserDetailsServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private CustomUserDetailsService service;

    @Test
    void loadUserByUsername_returnsAPrincipalWithTheRole() {
        User user = User.builder()
            .id(3L)
            .firstName("Ada")
            .lastName("Lovelace")
            .email("ada@example.com")
            .password("hash")
            .role(Role.builder().name("ADMIN").label("Marchand").build())
            .build();
        when(userRepository.findAccountByEmail("ada@example.com")).thenReturn(Optional.of(user));

        UserPrincipal principal = (UserPrincipal) service.loadUserByUsername("ada@example.com");

        assertThat(principal.getUsername()).isEqualTo("ada@example.com");
        assertThat(principal.getAuthorities()).extracting("authority").contains("ROLE_ADMIN");
    }

    @Test
    void loadUserByUsername_rejectsAnUnknownEmail() {
        when(userRepository.findAccountByEmail("missing@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.loadUserByUsername("missing@example.com"))
            .isInstanceOf(UsernameNotFoundException.class)
            .hasMessageContaining("missing@example.com");
        verify(userRepository).findAccountByEmail("missing@example.com");
    }
}
