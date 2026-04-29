package com.ecommerce.service;

import com.ecommerce.dto.request.SegmentRequest;
import com.ecommerce.dto.response.SegmentResponse;
import com.ecommerce.entity.Segment;
import com.ecommerce.repository.SegmentRepository;
import com.ecommerce.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SegmentService {

    private final SegmentRepository segmentRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<SegmentResponse> getAllSegments() {
        return segmentRepository.findAll().stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public SegmentResponse getSegmentById(Long id) {
        Segment segment = findOrThrow(id);
        return mapToResponse(segment);
    }

    @Transactional
    public SegmentResponse createSegment(SegmentRequest request) {
        if (segmentRepository.existsByName(request.getName().toUpperCase().trim())) {
            throw new IllegalArgumentException("Un segment avec ce nom existe déjà");
        }

        Segment segment = Segment.builder()
                .name(request.getName().toUpperCase().trim())
                .label(request.getLabel().trim())
                .description(request.getDescription())
                .color(request.getColor())
                .icon(request.getIcon())
                .build();

        applyBenefits(segment, request);
        segment = segmentRepository.save(segment);
        return mapToResponse(segment);
    }

    @Transactional
    public SegmentResponse updateSegment(Long id, SegmentRequest request) {
        Segment segment = findOrThrow(id);

        String newName = request.getName().toUpperCase().trim();
        if (!segment.getName().equals(newName) && segmentRepository.existsByName(newName)) {
            throw new IllegalArgumentException("Un segment avec ce nom existe déjà");
        }

        segment.setName(newName);
        segment.setLabel(request.getLabel().trim());
        segment.setDescription(request.getDescription());
        segment.setColor(request.getColor());
        segment.setIcon(request.getIcon());

        applyBenefits(segment, request);
        segment = segmentRepository.save(segment);
        return mapToResponse(segment);
    }

    private void applyBenefits(Segment s, SegmentRequest r) {
        if (r.getSeuilPoints() != null) s.setSeuilPoints(r.getSeuilPoints());
        if (r.getMultiplicateurPoints() != null) s.setMultiplicateurPoints(r.getMultiplicateurPoints());
        if (r.getRemiseAutomatique() != null) s.setRemiseAutomatique(r.getRemiseAutomatique());
        if (r.getRemiseAnniversaire() != null) s.setRemiseAnniversaire(r.getRemiseAnniversaire());
        if (r.getCashbackPourcentage() != null) s.setCashbackPourcentage(r.getCashbackPourcentage());
        if (r.getLivraisonGratuiteStandard() != null) s.setLivraisonGratuiteStandard(r.getLivraisonGratuiteStandard());
        if (r.getLivraisonGratuiteExpress() != null) s.setLivraisonGratuiteExpress(r.getLivraisonGratuiteExpress());
        if (r.getLivraisonPrioritaire() != null) s.setLivraisonPrioritaire(r.getLivraisonPrioritaire());
        if (r.getCadeauAnniversaire() != null) s.setCadeauAnniversaire(r.getCadeauAnniversaire());
        if (r.getEmballageOffert() != null) s.setEmballageOffert(r.getEmballageOffert());
        if (r.getEchantillonsGratuits() != null) s.setEchantillonsGratuits(r.getEchantillonsGratuits());
        if (r.getAccesAnticipe() != null) s.setAccesAnticipe(r.getAccesAnticipe());
        if (r.getProduitExclusif() != null) s.setProduitExclusif(r.getProduitExclusif());
        if (r.getInvitationsEvenements() != null) s.setInvitationsEvenements(r.getInvitationsEvenements());
        if (r.getAccesVentesPrivees() != null) s.setAccesVentesPrivees(r.getAccesVentesPrivees());
        if (r.getPrioriteSupport() != null) s.setPrioriteSupport(r.getPrioriteSupport());
        if (r.getRetourEtendu() != null) s.setRetourEtendu(r.getRetourEtendu());
        if (r.getConseillerPersonnel() != null) s.setConseillerPersonnel(r.getConseillerPersonnel());
        if (r.getBadgeVisible() != null) s.setBadgeVisible(r.getBadgeVisible());
    }

    @Transactional
    public void deleteSegment(Long id) {
        Segment segment = findOrThrow(id);
        long userCount = userRepository.countBySegmentId(segment.getId());
        if (userCount > 0) {
            throw new IllegalArgumentException(
                    "Impossible de supprimer ce segment : " + userCount + " utilisateur(s) y sont assignés");
        }
        segmentRepository.delete(segment);
    }

    private Segment findOrThrow(Long id) {
        return segmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Segment non trouvé avec l'id: " + id));
    }

    private SegmentResponse mapToResponse(Segment segment) {
        return LoyaltyService.mapSegment(segment, userRepository);
    }
}
