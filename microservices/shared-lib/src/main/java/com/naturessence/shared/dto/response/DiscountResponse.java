package com.naturessence.shared.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
public class DiscountResponse {

    private Long id;
    private String nom;
    private String type;
    private double valeur;

    private Long productId;
    private String productName;

    private Long categoryId;
    private String categoryName;

    private double prixOriginal;
    private double prixFinal;

    private String statut;

    private LocalDate dateDebut;
    private LocalDate dateFin;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
