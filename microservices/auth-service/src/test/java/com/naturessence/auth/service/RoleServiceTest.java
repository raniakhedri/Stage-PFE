package com.naturessence.auth.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.naturessence.auth.security.CallerContext;
import com.naturessence.shared.dto.request.RoleRequest;
import com.naturessence.shared.dto.response.RoleResponse;
import com.naturessence.shared.entity.Role;
import com.naturessence.shared.entity.User;
import com.naturessence.shared.enums.PermissionModule;
import com.naturessence.shared.repository.RoleRepository;
import com.naturessence.shared.repository.UserRepository;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class RoleServiceTest {

    @Mock private RoleRepository roleRepository;
    @Mock private UserRepository userRepository;
    @Mock private CallerContext caller;

    @InjectMocks
    private RoleService service;

    @Test
    void createRole_prefixesTheShopAndGrantsOnlyRequestedModules() {
        User me = merchant(12L);
        when(caller.require()).thenReturn(me);
        when(caller.requireShopId(me)).thenReturn(12L);
        when(roleRepository.existsByName("S12_PREPARATEUR")).thenReturn(false);
        when(roleRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(userRepository.countByRoleId(any())).thenReturn(0L);
        RoleRequest request = new RoleRequest();
        request.setLabel("Préparateur");
        request.setDescription("Prépare les commandes");
        request.setPermissions(Map.of(PermissionModule.COMMANDES.name(), true));

        RoleResponse created = service.createRole(request);

        assertThat(created.getName()).isEqualTo("S12_PREPARATEUR");
        assertThat(created.getPermissions()).containsEntry("COMMANDES", true);
        assertThat(created.getPermissions()).containsEntry("PRODUITS", false);
    }

    @Test
    void createRole_rejectsABlankLabel() {
        when(caller.require()).thenReturn(merchant(12L));
        RoleRequest request = new RoleRequest();
        request.setLabel("  ");

        assertThatThrownBy(() -> service.createRole(request))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("libellé");
    }

    @Test
    void deleteRole_protectsPlatformRolesAndRolesStillInUse() {
        User admin = User.builder().id(1L).firstName("S").lastName("A").email("s@example.com").password("x")
            .role(Role.builder().name("SUPER_ADMIN").label("Super").build()).build();
        when(caller.require()).thenReturn(admin);
        Role client = Role.builder().id(2L).name("CLIENT").label("Client").build();
        when(roleRepository.findById(2L)).thenReturn(Optional.of(client));

        assertThatThrownBy(() -> service.deleteRole(2L))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("système");

        Role custom = Role.builder().id(9L).name("S12_CAISSE").label("Caisse").shopId(12L).build();
        when(roleRepository.findById(9L)).thenReturn(Optional.of(custom));
        when(userRepository.countByRoleId(9L)).thenReturn(2L);
        User merchant = merchant(12L);
        when(caller.require()).thenReturn(merchant);

        assertThatThrownBy(() -> service.deleteRole(9L))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("2 membre");
    }

    @Test
    void ownedRole_hidesAnotherShopsRole() {
        Role foreign = Role.builder().id(9L).name("S8_CAISSE").label("Caisse").shopId(8L).build();
        when(roleRepository.findById(9L)).thenReturn(Optional.of(foreign));

        assertThatThrownBy(() -> service.ownedRole(merchant(12L), 9L))
            .isInstanceOf(ResponseStatusException.class);
    }

    @Test
    void getAllPermissions_listsEveryModule() {
        assertThat(service.getAllPermissions()).hasSize(PermissionModule.values().length);
        assertThat(service.getAllPermissions().get(0).getModule()).isEqualTo(PermissionModule.TABLEAU_DE_BORD.name());
    }

    @Test
    void updatePermissions_rejectsAnUnknownModule() {
        User merchant = merchant(12L);
        when(caller.require()).thenReturn(merchant);
        Role role = Role.builder().id(9L).name("S12_CAISSE").label("Caisse").shopId(12L).build();
        when(roleRepository.findById(9L)).thenReturn(Optional.of(role));
        com.naturessence.shared.dto.request.UpdatePermissionsRequest request =
            new com.naturessence.shared.dto.request.UpdatePermissionsRequest();
        request.setPermissions(Map.of("NOT_A_MODULE", true));

        assertThatThrownBy(() -> service.updatePermissions(9L, request))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("invalide");
        verify(roleRepository, org.mockito.Mockito.never()).save(any());
    }

    private static User merchant(long shopId) {
        return User.builder().id(4L).shopId(shopId).firstName("M").lastName("T").email("m@example.com").password("x")
            .role(Role.builder().name("ADMIN").label("Marchand").build()).build();
    }
}
