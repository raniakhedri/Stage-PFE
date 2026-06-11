package com.naturessence.shared.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
public class ReviewResponse {

    private Long id;
    private Long orderId;
    private String orderReference;
    private Long productId;
    private String productName;
    private Integer note;
    private String commentaire;
    private String statut;
    private String reponse;

    // User info
    private Long userId;
    private String clientName;
    private String clientInitials;

    private LocalDateTime createdAt;
}
