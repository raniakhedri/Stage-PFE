package com.ecommerce.controller;

import com.ecommerce.dto.request.NewsletterRequest;
import com.ecommerce.dto.response.EmailStatsResponse;
import com.ecommerce.dto.response.MessageResponse;
import com.ecommerce.entity.Segment;
import com.ecommerce.entity.User;
import com.ecommerce.enums.AccountStatus;
import com.ecommerce.repository.SegmentRepository;
import com.ecommerce.repository.UserRepository;
import com.ecommerce.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/email")
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
@RequiredArgsConstructor
public class AdminEmailController {

    private final UserRepository userRepository;
    private final SegmentRepository segmentRepository;
    private final EmailService emailService;

    @GetMapping("/stats")
    public ResponseEntity<EmailStatsResponse> getStats() {
        long totalClients  = userRepository.countByRoleName("CLIENT");
        long activeClients = userRepository.countByStatus(AccountStatus.ACTIVE);
        long newThisMonth  = userRepository.countNewClientsSince(LocalDateTime.now().withDayOfMonth(1).toLocalDate().atStartOfDay());

        List<Segment> segments = segmentRepository.findAll();
        List<EmailStatsResponse.SegmentCount> breakdown = segments.stream()
                .filter(s -> !"SUPER_ADMIN".equals(s.getName()) && !"ADMIN".equals(s.getName()))
                .map(s -> EmailStatsResponse.SegmentCount.builder()
                        .segmentName(s.getName())
                        .segmentLabel(s.getLabel() != null ? s.getLabel() : s.getName())
                        .count(userRepository.countBySegmentName(s.getName()))
                        .build())
                .toList();

        return ResponseEntity.ok(EmailStatsResponse.builder()
                .totalClients(totalClients)
                .activeClients(activeClients)
                .newThisMonth(newThisMonth)
                .segmentBreakdown(breakdown)
                .build());
    }

    @PostMapping("/newsletter")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<MessageResponse> sendNewsletter(@RequestBody NewsletterRequest req) {
        if (req.getSubject() == null || req.getSubject().isBlank()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Le sujet est requis"));
        }
        if (req.getHtmlContent() == null || req.getHtmlContent().isBlank()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Le contenu est requis"));
        }

        List<User> recipients;
        String segment = req.getSegment();

        if (segment == null || segment.isBlank() || "ALL".equalsIgnoreCase(segment)) {
            // All active clients
            recipients = userRepository.findAll().stream()
                    .filter(u -> u.getRole() != null && "CLIENT".equals(u.getRole().getName()))
                    .filter(u -> AccountStatus.ACTIVE.equals(u.getStatus()))
                    .toList();
        } else {
            // Specific segment
            recipients = userRepository.findAll().stream()
                    .filter(u -> u.getRole() != null && "CLIENT".equals(u.getRole().getName()))
                    .filter(u -> AccountStatus.ACTIVE.equals(u.getStatus()))
                    .filter(u -> u.getSegment() != null && segment.equalsIgnoreCase(u.getSegment().getName()))
                    .toList();
        }

        if (recipients.isEmpty()) {
            return ResponseEntity.ok(new MessageResponse("Aucun destinataire trouvé pour ce segment."));
        }

        emailService.sendNewsletter(recipients, req.getSubject(), req.getHtmlContent());
        return ResponseEntity.ok(new MessageResponse(
                "Newsletter envoyée à " + recipients.size() + " client(s) en arrière-plan."));
    }
}
