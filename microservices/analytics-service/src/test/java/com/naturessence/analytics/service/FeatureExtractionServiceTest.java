package com.naturessence.analytics.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import com.naturessence.shared.dto.analytics.UserFeaturesDTO;
import com.naturessence.shared.entity.Order;
import com.naturessence.shared.entity.Review;
import com.naturessence.shared.entity.Segment;
import com.naturessence.shared.entity.User;
import com.naturessence.shared.enums.Gender;
import com.naturessence.shared.enums.OrderStatus;
import com.naturessence.shared.repository.OrderRepository;
import com.naturessence.shared.repository.ReviewRepository;
import com.naturessence.shared.repository.UserRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class FeatureExtractionServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private ReviewRepository reviewRepository;

    @InjectMocks
    private FeatureExtractionService service;

    @Test
    void extract_throwsWhenUserIsMissing() {
        when(userRepository.findById(4L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.extract(4L))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("User not found");
    }

    @Test
    void extract_ignoresCancelledOrdersAndFillsDefaults() {
        LocalDateTime now = LocalDateTime.now();
        User user = User.builder()
            .id(4L)
            .firstName("Lina")
            .lastName("Ben Ali")
            .email("lina@example.com")
            .password("hash")
            .dateOfBirth(LocalDate.now().minusYears(30))
            .gender(Gender.FEMME)
            .createdAt(now.minusDays(60))
            .lastLogin(now.minusDays(2))
            .loyaltyPoints(15)
            .segment(Segment.builder().id(2L).name("FIDELE").label("Fidèle").build())
            .build();
        Order paid = Order.builder().total(100.0).couponCode("PROMO").status(OrderStatus.LIVREE).createdAt(now.minusDays(10)).build();
        Order cancelled = Order.builder().total(999.0).status(OrderStatus.ANNULEE).createdAt(now.minusDays(1)).build();
        when(userRepository.findById(4L)).thenReturn(Optional.of(user));
        when(orderRepository.findByUserIdOrderByCreatedAtDesc(4L)).thenReturn(List.of(cancelled, paid));
        when(reviewRepository.findByUserIdOrderByCreatedAtDesc(4L)).thenReturn(List.of(
            Review.builder().note(4).productId(1L).productName("Savon").build(),
            Review.builder().note(2).productId(2L).productName("Huile").build()
        ));

        UserFeaturesDTO features = service.extract(4L);

        assertThat(features.getAge()).isEqualTo(30);
        assertThat(features.getGender()).isEqualTo("Female");
        assertThat(features.getCity()).isEqualTo("Tunis");
        assertThat(features.getGouvernorat()).isEqualTo("Tunis");
        assertThat(features.getTenureDays()).isEqualTo(60);
        assertThat(features.getSegmentId()).isEqualTo(2);
        assertThat(features.getTotalOrders()).isEqualTo(1);
        assertThat(features.getTotalSpent()).isEqualTo(100.0);
        assertThat(features.getAvgOrderValue()).isEqualTo(100.0);
        assertThat(features.getOrderFrequency()).isEqualTo(0.5);
        assertThat(features.getDaysSinceLastOrder()).isEqualTo(10);
        assertThat(features.getDaysSinceLastLogin()).isEqualTo(2);
        assertThat(features.getReviewCount()).isEqualTo(2);
        assertThat(features.getAvgRating()).isEqualTo(3.0);
        assertThat(features.getCouponUsageCount()).isEqualTo(1);
        assertThat(features.getDiscountUserRatio()).isEqualTo(1.0);
    }

    @Test
    void extract_usesTenureWhenThereIsNoPurchaseOrLogin() {
        User user = User.builder()
            .id(5L)
            .firstName("Sam")
            .lastName("Test")
            .email("sam@example.com")
            .password("hash")
            .gender(Gender.HOMME)
            .createdAt(LocalDateTime.now().minusDays(12))
            .build();
        when(userRepository.findById(5L)).thenReturn(Optional.of(user));
        when(orderRepository.findByUserIdOrderByCreatedAtDesc(5L)).thenReturn(List.of());
        when(reviewRepository.findByUserIdOrderByCreatedAtDesc(5L)).thenReturn(List.of());

        UserFeaturesDTO features = service.extract(5L);

        assertThat(features.getGender()).isEqualTo("Male");
        assertThat(features.getTotalOrders()).isZero();
        assertThat(features.getAvgOrderValue()).isZero();
        assertThat(features.getDaysSinceLastOrder()).isEqualTo(12);
        assertThat(features.getDaysSinceLastLogin()).isEqualTo(12);
        assertThat(features.getSegmentId()).isEqualTo(1);
        assertThat(features.getOrderFrequency()).isZero();
    }
}
