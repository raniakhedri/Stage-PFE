package com.naturessence.auth.controller;

import com.naturessence.auth.service.SegmentService;
import com.naturessence.shared.dto.request.SegmentRequest;
import com.naturessence.shared.dto.response.MessageResponse;
import com.naturessence.shared.dto.response.SegmentResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/segments")
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
@RequiredArgsConstructor
public class AdminSegmentController {

    private final SegmentService segmentService;

    @GetMapping
    public ResponseEntity<List<SegmentResponse>> getAllSegments() {
        return ResponseEntity.ok(segmentService.getAllSegments());
    }

    @GetMapping("/{id}")
    public ResponseEntity<SegmentResponse> getSegmentById(@PathVariable Long id) {
        return ResponseEntity.ok(segmentService.getSegmentById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<SegmentResponse> createSegment(@Valid @RequestBody SegmentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(segmentService.createSegment(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<SegmentResponse> updateSegment(
            @PathVariable Long id,
            @Valid @RequestBody SegmentRequest request) {
        return ResponseEntity.ok(segmentService.updateSegment(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<MessageResponse> deleteSegment(@PathVariable Long id) {
        segmentService.deleteSegment(id);
        return ResponseEntity.ok(new MessageResponse("Segment supprimé avec succès"));
    }
}
