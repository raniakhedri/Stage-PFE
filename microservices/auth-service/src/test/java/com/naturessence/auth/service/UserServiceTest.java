package com.naturessence.auth.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.naturessence.auth.security.CallerContext;
import com.naturessence.shared.dto.request.CreateUserRequest;
import com.naturessence.shared.dto.response.UserResponse;
import com.naturessence.shared.entity.Order;
import com.naturessence.shared.entity.Role;
import com.naturessence.shared.entity.Segment;
import com.naturessence.shared.entity.Shop;
import com.naturessence.shared.entity.User;
import com.naturessence.shared.enums.AccountStatus;
import com.naturessence.shared.repository.CouponUsageRepository;
import com.naturessence.shared.repository.OrderRepository;
import com.naturessence.shared.repository.PointsTransactionRepository;
import com.naturessence.shared.repository.RefreshTokenRepository;
import com.naturessence.shared.repository.ReviewRepository;
import com.naturessence.shared.repository.RoleRepository;
import com.naturessence.shared.repository.SegmentRepository;
import com.naturessence.shared.repository.ShopRepository;
import com.naturessence.shared.repository.UserRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private ShopRepository shopRepository;
    @Mock private RoleRepository roleRepository;
    @Mock private SegmentRepository segmentRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private AuthService authService;
    @Mock private RefreshTokenRepository refreshTokenRepository;
    @Mock private CouponUsageRepository couponUsageRepository;
    @Mock private EmailService emailService;
    @Mock private PointsTransactionRepository pointsTransactionRepository;
    @Mock private ReviewRepository reviewRepository;
    @Mock private OrderRepository orderRepository;
    @Mock private CallerContext caller;
    @Mock private RoleService roleService;

    @InjectMocks
    private UserService service;

    @Test
    void createUser_assignsTheShopAndEmailsATemporaryPassword() {
        User me = merchant();
        when(caller.require()).thenReturn(me);
        when(roleRepository.findByName("CLIENT")).thenReturn(Optional.of(Role.builder().name("CLIENT").label("Client").build()));
        when(userRepository.clientEmailTaken("ada@example.com", 12L)).thenReturn(false);
        when(segmentRepository.findByName("NOUVEAU")).thenReturn(Optional.of(Segment.builder().name("NOUVEAU").label("Nouveau").build()));
        when(passwordEncoder.encode(anyString())).thenReturn("hashed");
        when(userRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(shopRepository.findById(12L)).thenReturn(Optional.of(Shop.builder().id(12L).name("Demo").slug("demo").build()));
        when(authService.mapToUserResponse(any())).thenReturn(UserResponse.builder().email("ada@example.com").build());
        CreateUserRequest request = new CreateUserRequest();
        request.setFirstName("Ada");
        request.setLastName("Lovelace");
        request.setEmail("Ada@Example.com");

        UserResponse created = service.createUser(request);

        assertThat(created.getEmail()).isEqualTo("ada@example.com");
        verify(emailService).sendAccountInvite(any(), anyString(), org.mockito.ArgumentMatchers.eq("Demo"), org.mockito.ArgumentMatchers.eq("demo"), org.mockito.ArgumentMatchers.eq(false));
    }

    @Test
    void createUser_refusesARoleFromAnotherShop() {
        when(caller.require()).thenReturn(merchant());
        when(roleRepository.findByName("S8_CAISSE")).thenReturn(Optional.of(
            Role.builder().name("S8_CAISSE").label("Caisse").shopId(8L).build()
        ));
        CreateUserRequest request = new CreateUserRequest();
        request.setFirstName("Ada");
        request.setLastName("L");
        request.setEmail("ada@example.com");
        request.setRole("s8_caisse");

        assertThatThrownBy(() -> service.createUser(request))
            .isInstanceOf(ResponseStatusException.class)
            .extracting(ex -> ((ResponseStatusException) ex).getStatusCode())
            .isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void inviteTeamMember_requiresAnEmail() {
        User me = merchant();
        when(caller.require()).thenReturn(me);
        when(caller.requireShopId(me)).thenReturn(12L);

        assertThatThrownBy(() -> service.inviteTeamMember(" ", "L", "  ", null, 1L))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("obligatoires");
    }

    @Test
    void changeStatus_refusesToDisableTheOwner() {
        User me = merchant();
        User owner = merchant();
        owner.setId(4L);
        when(caller.require()).thenReturn(me);
        when(userRepository.findById(4L)).thenReturn(Optional.of(owner));
        when(shopRepository.findById(12L)).thenReturn(Optional.of(
            Shop.builder().id(12L).name("Demo").slug("demo").ownerId(4L).build()
        ));

        assertThatThrownBy(() -> service.changeStatus(4L, AccountStatus.INACTIVE))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("propriétaire");
    }

    @Test
    void deleteUser_clearsRelatedRowsAndKeepsOrders() {
        User target = User.builder().id(7L).firstName("C").lastName("L").email("c@example.com").password("x").build();
        Order order = Order.builder().id(20L).build();
        order.setUser(target);
        when(userRepository.findById(7L)).thenReturn(Optional.of(target));
        when(pointsTransactionRepository.findByUserIdOrderByCreatedAtDesc(7L)).thenReturn(List.of());
        when(reviewRepository.findByUserIdOrderByCreatedAtDesc(7L)).thenReturn(List.of());
        when(orderRepository.findByUserIdOrderByCreatedAtDesc(7L)).thenReturn(List.of(order));

        service.deleteUser(7L);

        assertThat(order.getUser()).isNull();
        verify(refreshTokenRepository).deleteByUserId(7L);
        verify(couponUsageRepository).deleteByUserId(7L);
        verify(orderRepository).save(order);
        verify(userRepository).delete(target);
    }

    @Test
    void getAllUsers_returnsAnEmptyPageForAnUnknownShop() {
        when(shopRepository.findBySlug("missing")).thenReturn(Optional.empty());

        Page<UserResponse> page = service.getAllUsers(PageRequest.of(0, 10), "Missing");

        assertThat(page.getContent()).isEmpty();
    }

    private static User merchant() {
        return User.builder().id(4L).shopId(12L).firstName("M").lastName("T").email("m@example.com").password("x")
            .status(AccountStatus.ACTIVE)
            .role(Role.builder().name("ADMIN").label("Marchand").build())
            .build();
    }
}
