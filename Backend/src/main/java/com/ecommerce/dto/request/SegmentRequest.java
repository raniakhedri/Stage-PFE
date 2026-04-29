package com.ecommerce.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SegmentRequest {

    @NotBlank(message = "Le nom est obligatoire")
    private String name;

    @NotBlank(message = "Le label est obligatoire")
    private String label;

    private String color;
    private String description;
    private String icon;

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
