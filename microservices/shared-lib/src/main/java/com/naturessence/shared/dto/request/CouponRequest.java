package com.naturessence.shared.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Data
public class CouponRequest {

    @NotBlank(message = "Le code est obligatoire")
    private String code;

    @NotBlank(message = "Le type est obligatoire")
    private String type;

    private double valeur;
    private double montantMin;

    private LocalDate dateDebut;
    private LocalDate dateFin;
    private LocalTime heureDebut;
    private LocalTime heureFin;

    private String statut = "actif";

    private int limiteGlobale;
    private int limiteClient = 1;

    /** Segment name — null means all clients */
    private String segment;

    /** Category names */
    private List<String> categories;

    /** Product names (for future) */
    private List<String> produits;

    private boolean auto;
    private String autoTrigger;
}
