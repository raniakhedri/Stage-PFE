package com.naturessence.auth.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.naturessence.auth.config.SecurityConfig;
import com.naturessence.auth.service.AuthService;
import com.naturessence.auth.service.MerchantVerificationService;
import com.naturessence.shared.dto.response.AuthResponse;
import com.naturessence.shared.repository.UserRepository;
import com.naturessence.shared.security.JwtUtil;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(controllers = AuthController.class)
@Import(SecurityConfig.class)
@AutoConfigureMockMvc
class AuthControllerTest {

    @Autowired
    private MockMvc mvc;

    @MockBean
    private AuthService authService;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private MerchantVerificationService verificationService;

    @MockBean
    private JwtUtil jwtUtil;

    @MockBean
    private UserDetailsService userDetailsService;

    @Test
    void login_rejectsAnEmptyBody() throws Exception {
        mvc.perform(post("/api/v1/auth/login").contentType("application/json").content("{}"))
            .andExpect(status().isBadRequest());
    }

    @Test
    void login_returnsTheTokens() throws Exception {
        when(authService.login(any())).thenReturn(AuthResponse.builder().accessToken("access-1").refreshToken("refresh-1").build());

        mvc.perform(post("/api/v1/auth/login")
                .contentType("application/json")
                .content("{\"email\":\"ada@example.com\",\"password\":\"password1\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.accessToken").value("access-1"))
            .andExpect(jsonPath("$.refreshToken").value("refresh-1"));
    }

    @Test
    void logout_withoutAuthentication_isUnauthorized() throws Exception {
        mvc.perform(post("/api/v1/auth/logout"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "42", roles = "ADMIN")
    void logout_withANumericPrincipal_succeeds() throws Exception {
        mvc.perform(post("/api/v1/auth/logout"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.message").value("Déconnexion réussie"));
        verify(authService).logout(42L);
    }
}
