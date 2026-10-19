package com.naturessence.auth.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.naturessence.shared.dto.response.LeaderboardEntryResponse;
import com.naturessence.shared.dto.response.LoyaltyInfoResponse;
import com.naturessence.shared.entity.LoyaltyConfig;
import com.naturessence.shared.entity.PointsTransaction;
import com.naturessence.shared.entity.Segment;
import com.naturessence.shared.entity.User;
import com.naturessence.shared.repository.LoyaltyConfigRepository;
import com.naturessence.shared.repository.PointsTransactionRepository;
import com.naturessence.shared.repository.SegmentRepository;
import com.naturessence.shared.repository.UserRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;

@ExtendWith(MockitoExtension.class)
class LoyaltyServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private SegmentRepository segmentRepository;
    @Mock private LoyaltyConfigRepository loyaltyConfigRepository;
    @Mock private PointsTransactionRepository pointsTransactionRepository;

    @InjectMocks
    private LoyaltyService service;

    @Test
    void getOrCreateConfig_savesADefaultWhenNoneExists() {
        when(loyaltyConfigRepository.findAll()).thenReturn(List.of());
        when(loyaltyConfigRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        LoyaltyConfig config = service.getOrCreateConfig();

        assertThat(config.getPointsParTnd()).isEqualTo(1.0);
        verify(loyaltyConfigRepository).save(any());
    }

    @Test
    void updateConfig_changesOnlyProvidedFields() {
        LoyaltyConfig current = LoyaltyConfig.builder().pointsParTnd(1.0).pointsAvis(20).build();
        when(loyaltyConfigRepository.findAll()).thenReturn(List.of(current));
        when(loyaltyConfigRepository.save(current)).thenReturn(current);

        LoyaltyConfig incoming = LoyaltyConfig.builder().pointsAvis(40).build();
        service.updateConfig(incoming);

        assertThat(current.getPointsAvis()).isEqualTo(40);
        assertThat(current.getPointsParTnd()).isEqualTo(1.0);
    }

    @Test
    void awardPointsForOrder_doesNothingWhenTheRoundedTotalIsZero() {
        User user = User.builder().id(1L).firstName("A").lastName("B").email("a@b.c").password("x").loyaltyPoints(0).build();
        when(loyaltyConfigRepository.findAll()).thenReturn(List.of(LoyaltyConfig.builder().pointsParTnd(0.0).build()));

        service.awardPointsForOrder(user, 20, 9L);

        verify(pointsTransactionRepository, never()).save(any());
        assertThat(user.getLoyaltyPoints()).isZero();
    }

    @Test
    void awardPointsForOrder_appliesTheSegmentMultiplierAndPromotes() {
        Segment bronze = Segment.builder().id(1L).name("BRONZE").label("Bronze").seuilPoints(0).multiplicateurPoints(2.0).build();
        Segment gold = Segment.builder().id(2L).name("OR").label("Or").seuilPoints(100).build();
        User user = User.builder().id(1L).firstName("A").lastName("B").email("a@b.c").password("x")
            .loyaltyPoints(10).segment(bronze).build();
        LoyaltyConfig config = LoyaltyConfig.builder().pointsParTnd(1.0).autoSegmentPromotion(true).build();
        when(loyaltyConfigRepository.findAll()).thenReturn(List.of(config));
        when(segmentRepository.findAll()).thenReturn(List.of(bronze, gold, Segment.builder().name("INACTIF").label("Inactif").seuilPoints(1).build()));

        service.awardPointsForOrder(user, 50, 9L);

        assertThat(user.getLoyaltyPoints()).isEqualTo(110);
        assertThat(user.getSegment()).isSameAs(gold);
        verify(pointsTransactionRepository).save(any(PointsTransaction.class));
    }

    @Test
    void adjustPoints_neverGoesBelowZero() {
        User user = User.builder().id(3L).firstName("A").lastName("B").email("a@b.c").password("x").loyaltyPoints(5).build();
        when(userRepository.findById(3L)).thenReturn(Optional.of(user));

        service.adjustPoints(3L, -20, "  ");

        assertThat(user.getLoyaltyPoints()).isZero();
        verify(userRepository).save(user);
    }

    @Test
    void getLoyaltyInfo_pointsAtTheNextTier() {
        Segment current = Segment.builder().id(1L).name("BRONZE").label("Bronze").seuilPoints(0).build();
        Segment next = Segment.builder().id(2L).name("OR").label("Or").seuilPoints(200).build();
        User user = User.builder().id(3L).firstName("A").lastName("B").email("a@b.c").password("x")
            .loyaltyPoints(40).segment(current).build();
        when(userRepository.findById(3L)).thenReturn(Optional.of(user));
        when(segmentRepository.findAll()).thenReturn(List.of(next, current));
        when(pointsTransactionRepository.findByUserIdOrderByCreatedAtDesc(3L)).thenReturn(List.of());
        when(userRepository.countBySegmentId(any())).thenReturn(0L);

        LoyaltyInfoResponse info = service.getLoyaltyInfo(3L);

        assertThat(info.getPoints()).isEqualTo(40);
        assertThat(info.getNextSegment().getName()).isEqualTo("OR");
        assertThat(info.getHistory()).isEmpty();
    }

    @Test
    void getLeaderboard_numbersRowsFromOne() {
        User first = User.builder().id(1L).firstName("Ada").lastName("L").email("ada@example.com").password("x")
            .loyaltyPoints(90).segment(Segment.builder().name("OR").label("Or").color("#ffd700").build()).build();
        when(userRepository.findTopClientsByLoyaltyPoints(PageRequest.of(0, 2))).thenReturn(List.of(first));

        List<LeaderboardEntryResponse> board = service.getLeaderboard(2);

        assertThat(board).hasSize(1);
        assertThat(board.get(0).getRank()).isEqualTo(1);
        assertThat(board.get(0).getFullName()).isEqualTo("Ada L");
        assertThat(board.get(0).getSegmentLabel()).isEqualTo("Or");
    }
}
