package com.naturessence.shared.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
public class CouponResponse {

    private Long id;
    private String code;
    private String type;
    private double valeur;
    private double montantMin;

    private LocalDate dateDebut;
    private LocalDate dateFin;
    private LocalTime heureDebut;
    private LocalTime heureFin;

    private String statut;

    private int utilisations;
    private int limiteGlobale;
    private int limiteClient;

    private String segment;
    private List<String> categories;
    private List<String> produits;

    private double revenus;
    private int commandes;
    private double conversion;

    private boolean auto;
    private String autoTrigger;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
