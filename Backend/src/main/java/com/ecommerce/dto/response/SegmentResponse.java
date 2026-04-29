package com.ecommerce.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class SegmentResponse {
    private Long id;
    private String name;
    private String label;
    private String color;
    private String description;
    private String icon;
    private long userCount;

    // ── Loyalty ──────────────────────────────────────────────────────────────
    private Integer seuilPoints;
    private Double multiplicateurPoints;

    // ── Discounts ─────────────────────────────────────────────────────────────
    private Double remiseAutomatique;
    private Double remiseAnniversaire;
    private Double cashbackPourcentage;

    // ── Shipping ──────────────────────────────────────────────────────────────
    private Boolean livraisonGratuiteStandard;
    private Boolean livraisonGratuiteExpress;
    private Boolean livraisonPrioritaire;

    // ── Gifts ─────────────────────────────────────────────────────────────────
    private Boolean cadeauAnniversaire;
    private Boolean emballageOffert;
    private Boolean echantillonsGratuits;

    // ── Access ────────────────────────────────────────────────────────────────
    private Boolean accesAnticipe;
    private Boolean produitExclusif;
    private Boolean invitationsEvenements;
    private Boolean accesVentesPrivees;

    // ── Service ───────────────────────────────────────────────────────────────
    private Boolean prioriteSupport;
    private Boolean retourEtendu;
    private Boolean conseillerPersonnel;

    // ── Recognition ──────────────────────────────────────────────────────────
    private Boolean badgeVisible;
}
