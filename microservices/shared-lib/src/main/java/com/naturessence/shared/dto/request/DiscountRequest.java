package com.naturessence.shared.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDate;

@Data
public class DiscountRequest {

    private String nom;

    @NotBlank(message = "Le type est obligatoire")
    private String type;

    private double valeur;

    /** Target product ID (for future product link) */
    private Long productId;

    /** Product name for display */
    private String productName;

    /** Target category ID */
    private Long categoryId;

    private double prixOriginal;

    private String statut = "actif";

    private LocalDate dateDebut;
    private LocalDate dateFin;
}
