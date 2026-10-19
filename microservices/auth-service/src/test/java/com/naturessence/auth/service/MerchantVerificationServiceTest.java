package com.naturessence.auth.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.naturessence.shared.dto.request.MerchantVerificationRequest;
import com.naturessence.shared.entity.MerchantVerification;
import com.naturessence.shared.entity.Role;
import com.naturessence.shared.entity.Shop;
import com.naturessence.shared.entity.User;
import com.naturessence.shared.enums.AccountStatus;
import com.naturessence.shared.repository.MerchantVerificationRepository;
import com.naturessence.shared.repository.ShopRepository;
import com.naturessence.shared.repository.UserRepository;
import java.time.YearMonth;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class MerchantVerificationServiceTest {

    @Mock private MerchantVerificationRepository verificationRepository;
    @Mock private ShopRepository shopRepository;
    @Mock private UserRepository userRepository;
    @Mock private RefreshTokenService refreshTokenService;

    @InjectMocks
    private MerchantVerificationService service;

    @Test
    void requireComplete_acceptsACinAndNormalizesTheNumber() {
        MerchantVerificationRequest request = valid("CIN");
        request.setDocumentNumber("12 345 678");

        MerchantVerificationRequest checked = service.requireComplete(request);

        assertThat(checked.getDocumentType()).isEqualTo("CIN");
        assertThat(checked.getDocumentNumber()).isEqualTo("12345678");
    }

    @Test
    void requireComplete_rejectsAShortCinAnExpiredCardAndAMissingKey() {
        MerchantVerificationRequest shortCin = valid("CIN");
        shortCin.setDocumentNumber("123");
        assertThatThrownBy(() -> service.requireComplete(shortCin))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("8 chiffres");

        MerchantVerificationRequest expired = valid("PASSPORT");
        expired.setCardExpYear(2000);
        expired.setCardExpMonth(1);
        assertThatThrownBy(() -> service.requireComplete(expired))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("expirée");

        assertThatThrownBy(() -> service.requireComplete(null))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("obligatoire");
    }

    @Test
    void reject_requiresAReasonAndMarksTheShop() {
        assertThatThrownBy(() -> service.reject(1L, "  ", "reviewer@example.com"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("motif");

        MerchantVerification file = MerchantVerification.builder().id(1L).shopId(3L).userId(4L).status("PENDING").build();
        Shop shop = Shop.builder().id(3L).name("Demo").slug("demo").status(Shop.PENDING).build();
        when(verificationRepository.findById(1L)).thenReturn(Optional.of(file));
        when(shopRepository.findById(3L)).thenReturn(Optional.of(shop));
        when(userRepository.findById(4L)).thenReturn(Optional.empty());

        Map<String, Object> result = service.reject(1L, " Photo floue ", "reviewer@example.com");

        assertThat(file.getStatus()).isEqualTo(MerchantVerificationService.REJECTED);
        assertThat(file.getRejectionReason()).isEqualTo("Photo floue");
        assertThat(shop.getStatus()).isEqualTo(Shop.REJECTED);
        assertThat(result).containsEntry("status", "REJECTED");
        verify(verificationRepository).save(file);
    }

    @Test
    void approve_activatesTheShop() {
        MerchantVerification file = MerchantVerification.builder().id(2L).shopId(3L).userId(4L).build();
        Shop shop = Shop.builder().id(3L).name("Demo").slug("demo").status(Shop.PENDING).build();
        when(verificationRepository.findById(2L)).thenReturn(Optional.of(file));
        when(shopRepository.findById(3L)).thenReturn(Optional.of(shop));

        service.approve(2L, "reviewer@example.com");

        assertThat(file.getStatus()).isEqualTo(MerchantVerificationService.APPROVED);
        assertThat(shop.getStatus()).isEqualTo(Shop.ACTIVE);
    }

    @Test
    void setUserBlocked_refusesAPlatformAccountAndEndsAMerchantSession() {
        User platform = User.builder().id(1L).firstName("S").lastName("A").email("s@example.com").password("x")
            .role(Role.builder().name("SUPER_ADMIN").label("Super").build()).build();
        assertThatThrownBy(() -> service.setUserBlocked(platform, true))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("plateforme");

        User merchant = User.builder().id(4L).firstName("M").lastName("T").email("m@example.com").password("x")
            .status(AccountStatus.ACTIVE).role(Role.builder().name("ADMIN").label("Marchand").build()).build();
        service.setUserBlocked(merchant, true);

        assertThat(merchant.getStatus()).isEqualTo(AccountStatus.BLOCKED);
        verify(refreshTokenService).deleteByUserId(4L);
        verify(userRepository).save(merchant);
    }

    @Test
    void resubmit_refusesAShopThatIsNotRejected() {
        User merchant = User.builder().id(4L).shopId(3L).firstName("M").lastName("T").email("m@example.com").password("x").build();
        when(shopRepository.findById(3L)).thenReturn(Optional.of(
            Shop.builder().id(3L).name("Demo").slug("demo").status(Shop.PENDING).build()
        ));

        assertThatThrownBy(() -> service.resubmit(merchant, valid("CIN")))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("déjà");
        verify(verificationRepository, never()).save(any());
    }

    private static MerchantVerificationRequest valid(String type) {
        YearMonth next = YearMonth.now().plusMonths(2);
        MerchantVerificationRequest request = new MerchantVerificationRequest();
        request.setDocumentType(type);
        request.setDocumentNumber("CIN".equals(type) ? "12345678" : "AB123456");
        request.setDocumentFront("data:image/jpeg;base64,abc");
        request.setDocumentBack("CIN".equals(type) ? "data:image/jpeg;base64,def" : null);
        request.setSelfie("data:image/jpeg;base64,ghi");
        request.setStripePaymentMethodId("pm_test_123");
        request.setCardLast4("4242");
        request.setCardExpMonth(next.getMonthValue());
        request.setCardExpYear(next.getYear());
        request.setCardholderName("Ada Lovelace");
        return request;
    }
}
