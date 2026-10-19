package com.naturessence.auth.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.naturessence.shared.dto.request.SegmentRequest;
import com.naturessence.shared.dto.response.SegmentResponse;
import com.naturessence.shared.entity.Segment;
import com.naturessence.shared.repository.SegmentRepository;
import com.naturessence.shared.repository.UserRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class SegmentServiceTest {

    @Mock private SegmentRepository segmentRepository;
    @Mock private UserRepository userRepository;

    @InjectMocks
    private SegmentService service;

    @Test
    void createSegment_uppercasesTheNameAndAppliesBenefits() {
        when(segmentRepository.existsByName("OR")).thenReturn(false);
        when(segmentRepository.save(any())).thenAnswer(invocation -> {
            Segment saved = invocation.getArgument(0);
            saved.setId(6L);
            return saved;
        });
        when(userRepository.countBySegmentId(6L)).thenReturn(0L);
        SegmentRequest request = new SegmentRequest();
        request.setName(" or ");
        request.setLabel(" Or ");
        request.setColor("#ffd700");
        request.setSeuilPoints(100);
        request.setMultiplicateurPoints(1.5);

        SegmentResponse created = service.createSegment(request);

        assertThat(created.getName()).isEqualTo("OR");
        assertThat(created.getLabel()).isEqualTo("Or");
        assertThat(created.getSeuilPoints()).isEqualTo(100);
        assertThat(created.getMultiplicateurPoints()).isEqualTo(1.5);
    }

    @Test
    void createSegment_rejectsADuplicateName() {
        when(segmentRepository.existsByName("OR")).thenReturn(true);
        SegmentRequest request = new SegmentRequest();
        request.setName("or");
        request.setLabel("Or");

        assertThatThrownBy(() -> service.createSegment(request))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("existe déjà");
    }

    @Test
    void deleteSegment_refusesWhenUsersAreAssigned() {
        Segment segment = Segment.builder().id(6L).name("OR").label("Or").build();
        when(segmentRepository.findById(6L)).thenReturn(Optional.of(segment));
        when(userRepository.countBySegmentId(6L)).thenReturn(3L);

        assertThatThrownBy(() -> service.deleteSegment(6L))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("3 utilisateur");
    }

    @Test
    void getSegmentById_throwsWhenMissing() {
        when(segmentRepository.findById(6L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getSegmentById(6L))
            .isInstanceOf(RuntimeException.class)
            .hasMessageContaining("6");
    }

    @Test
    void getAllSegments_mapsEveryRow() {
        when(segmentRepository.findAll()).thenReturn(List.of(Segment.builder().id(1L).name("NOUVEAU").label("Nouveau").build()));
        when(userRepository.countBySegmentId(1L)).thenReturn(4L);

        assertThat(service.getAllSegments()).extracting(SegmentResponse::getUserCount).containsExactly(4L);
    }

    @Test
    void updateSegment_keepsTheNameWhenItDoesNotChange() {
        Segment segment = Segment.builder().id(1L).name("OR").label("Or").build();
        when(segmentRepository.findById(1L)).thenReturn(Optional.of(segment));
        when(segmentRepository.save(segment)).thenReturn(segment);
        when(userRepository.countBySegmentId(1L)).thenReturn(0L);
        SegmentRequest request = new SegmentRequest();
        request.setName("or");
        request.setLabel("Or premium");
        request.setLivraisonGratuiteStandard(true);

        SegmentResponse updated = service.updateSegment(1L, request);

        assertThat(updated.getLabel()).isEqualTo("Or premium");
        assertThat(updated.getLivraisonGratuiteStandard()).isTrue();
        verify(segmentRepository).save(segment);
    }
}
