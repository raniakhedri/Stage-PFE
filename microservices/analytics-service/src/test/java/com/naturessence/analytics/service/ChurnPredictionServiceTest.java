package com.naturessence.analytics.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import com.naturessence.shared.dto.analytics.UserFeaturesDTO;
import com.naturessence.shared.entity.Shop;
import com.naturessence.shared.entity.User;
import com.naturessence.shared.repository.ShopRepository;
import com.naturessence.shared.repository.UserRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class ChurnPredictionServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private ShopRepository shopRepository;

    @InjectMocks
    private ChurnPredictionService service;

    @BeforeEach
    void useMissingInterpreter() {
        ReflectionTestUtils.setField(service, "pythonCommand", "python-not-installed-for-tests");
    }

    @Test
    void modelFor_usesClothesModelOnFashionShops() {
        User user = User.builder().id(7L).shopId(3L).firstName("A").lastName("B").email("a@b.c").password("x").build();
        Shop shop = Shop.builder().id(3L).name("Mode").slug("mode").businessType("CLOTHES").build();
        when(userRepository.findById(7L)).thenReturn(Optional.of(user));
        when(shopRepository.findById(3L)).thenReturn(Optional.of(shop));

        assertThat(service.modelFor(null)).isEqualTo("general");
        assertThat(service.modelFor(7L)).isEqualTo("clothes");
        assertThat(service.modelFor(99L)).isEqualTo("general");
    }

    @Test
    void riskLabel_usesDefaultBands() {
        assertThat(service.riskLabel(0.71)).isEqualTo("HIGH");
        assertThat(service.riskLabel(0.41, "clothes")).isEqualTo("MEDIUM");
        assertThat(service.riskLabel(0.40, "general")).isEqualTo("LOW");
        assertThat(service.riskLabel(0.9, "unknown-model")).isEqualTo("HIGH");
    }

    @Test
    void predictAll_returnsEmptyWithoutCallingPython() throws Exception {
        assertThat(service.predictAll(List.of())).isEmpty();
        assertThat(service.predictAll(null)).isEmpty();
    }

    @Test
    void predictAll_failsWhenInterpreterIsMissing() {
        UserFeaturesDTO features = UserFeaturesDTO.builder().userId(1L).age(30).build();

        assertThatThrownBy(() -> service.predictAll(List.of(features)))
            .isInstanceOf(Exception.class);
    }
}
