package com.ecommerce.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "products")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nom;

    @Column(nullable = false, unique = true)
    private String slug;

    private String sku;

    @Column(columnDefinition = "TEXT")
    private String description;

    // ── Category ──────────────────────────────────────────────────
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @Column(name = "sub_category")
    private String subCategory;

    /** Comma-separated collection names */
    @Column(columnDefinition = "TEXT")
    private String collections;

    // ── Pricing ───────────────────────────────────────────────────
    @Builder.Default
    private double salePrice = 0;

    @Builder.Default
    private double costPrice = 0;

    @Builder.Default
    private boolean promoActive = false;

    @Builder.Default
    private double promoPrice = 0;

    private LocalDate promoStart;
    private LocalDate promoEnd;

    // ── Stock ─────────────────────────────────────────────────────
    @Builder.Default
    private int stock = 0;

    // ── Status: actif | archive | desactive | draft ───────────────
    @Column(nullable = false)
    @Builder.Default
    private String statut = "actif";

    // ── Marketing Badges ──────────────────────────────────────────
    @Builder.Default
    private boolean badgeNouveau = false;

    @Builder.Default
    private boolean badgeBestSeller = false;

    @Builder.Default
    private boolean badgePromo = false;

    @Builder.Default
    private boolean badgeExclusif = false;

    // ── Visibility ────────────────────────────────────────────────
    @Builder.Default
    private boolean visibleSite = true;

    @Builder.Default
    private boolean visibleCategory = true;

    @Builder.Default
    @Column(columnDefinition = "boolean default false")
    private boolean pinnedInSubCategory = false;

    // ── Cosmetics-specific ────────────────────────────────────────
    /** Scientific / botanical name (e.g. "Lavandula angustifolia") */
    private String latin;

    /** Organic certification flag */
    @Builder.Default
    private boolean bio = false;

    /** Country/region of origin (e.g. "France / Méditerranée") */
    private String origine;

    /** Usage instructions text (Conseils d'utilisation tab) */
    @Column(columnDefinition = "TEXT")
    private String usageInstructions;

    /** Safety precautions text */
    @Column(columnDefinition = "TEXT")
    private String precautions;

    /** INCI composition string */
    @Column(columnDefinition = "TEXT")
    private String inciComposition;

    /** Comma-separated certifications (e.g. "Bio certifié,Écocert,Cosmos Natural") */
    @Column(columnDefinition = "TEXT")
    private String certifications;

    /** Comma-separated available volumes (e.g. "10ml,30ml,50ml,100ml") */
    @Column(columnDefinition = "TEXT")
    private String volumes;

    // ── SEO ───────────────────────────────────────────────────────
    @Column(name = "meta_title")
    private String metaTitle;

    // ── Shipping & Dimensions ─────────────────────────────────────
    @Builder.Default
    private double weight = 0;

    @Builder.Default
    private double dimensionLength = 0;

    @Builder.Default
    private double dimensionWidth = 0;

    @Builder.Default
    private double dimensionHeight = 0;

    @Builder.Default
    private boolean specificFees = false;

    // ── Performance label ─────────────────────────────────────────
    private String performance;

    // ── Media ─────────────────────────────────────────────────────
    @Column(name = "image_url", columnDefinition = "TEXT")
    private String imageUrl;

    /** Comma-separated gallery image URLs */
    @Column(columnDefinition = "TEXT")
    private String images;

    // ── Upsell / Cross-sell (comma-separated product names) ───────
    @Column(name = "upsell_tags", columnDefinition = "TEXT")
    private String upsellTags;

    // ── Variants ──────────────────────────────────────────────────
    @Builder.Default
    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ProductVariant> variants = new ArrayList<>();

    // ── Audit ─────────────────────────────────────────────────────
    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
