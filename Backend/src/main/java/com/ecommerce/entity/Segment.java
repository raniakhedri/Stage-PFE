package com.ecommerce.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "segments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Segment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = false)
    private String label;

    private String color;

    private String description;

    private String icon;

    // ── Loyalty / points ────────────────────────────────────────────────────

    /** Minimum accumulated points required to reach (or stay in) this tier. 0 = base tier */
    @Builder.Default
    private Integer seuilPoints = 0;

    /** Points multiplier for orders (e.g. 1.0 = 1×, 2.0 = 2×) */
    @Builder.Default
    private Double multiplicateurPoints = 1.0;

    // ── Automatic discounts ──────────────────────────────────────────────────

    /** Permanent automatic discount (%) applied at checkout for this tier */
    @Builder.Default
    private Double remiseAutomatique = 0.0;

    /** Extra discount (%) applied during the client's birthday month */
    @Builder.Default
    private Double remiseAnniversaire = 0.0;

    /** Cashback percentage credited as points after delivery */
    @Builder.Default
    private Double cashbackPourcentage = 0.0;

    // ── Shipping benefits ────────────────────────────────────────────────────

    /** Free standard delivery regardless of cart total */
    @Builder.Default
    private Boolean livraisonGratuiteStandard = false;

    /** Free express delivery */
    @Builder.Default
    private Boolean livraisonGratuiteExpress = false;

    /** Orders from this tier are processed with higher priority */
    @Builder.Default
    private Boolean livraisonPrioritaire = false;

    // ── Gifts & surprises ────────────────────────────────────────────────────

    /** Birthday gift or voucher sent during birthday month */
    @Builder.Default
    private Boolean cadeauAnniversaire = false;

    /** Free gift-wrapping on every order */
    @Builder.Default
    private Boolean emballageOffert = false;

    /** Free product samples included in every order */
    @Builder.Default
    private Boolean echantillonsGratuits = false;

    // ── Access & exclusivity ─────────────────────────────────────────────────

    /** Early access to new collections before public launch */
    @Builder.Default
    private Boolean accesAnticipe = false;

    /** Access to an exclusive product catalogue */
    @Builder.Default
    private Boolean produitExclusif = false;

    /** Invitations to brand events, launches and workshops */
    @Builder.Default
    private Boolean invitationsEvenements = false;

    /** Access to private sales */
    @Builder.Default
    private Boolean accesVentesPrivees = false;

    // ── Customer service ─────────────────────────────────────────────────────

    /** Priority handling by customer support team */
    @Builder.Default
    private Boolean prioriteSupport = false;

    /** Extended return period (e.g. 60 days instead of 30) */
    @Builder.Default
    private Boolean retourEtendu = false;

    /** Dedicated personal beauty / product advisor */
    @Builder.Default
    private Boolean conseillerPersonnel = false;

    // ── Recognition ─────────────────────────────────────────────────────────

    /** Display the tier badge on the client's public profile and reviews */
    @Builder.Default
    private Boolean badgeVisible = true;
}
