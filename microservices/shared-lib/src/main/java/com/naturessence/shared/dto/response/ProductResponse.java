package com.naturessence.shared.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
public class ProductResponse {

    private Long id;
    private String nom;
    private String slug;
    private String sku;
    private String description;

    private Long categoryId;
    private Long parentCategoryId;
    private String parentCategoryNom;
    private String categoryNom;
    private String subCategory;
    private String collections;

    // Pricing
    private double salePrice;
    private boolean promoActive;
    private double promoPrice;
    private LocalDate promoStart;
    private LocalDate promoEnd;

    // Stock
    private int stock;
    private String stockStatus;

    // Status
    private String statut;

    // Badges
    private boolean badgeNouveau;
    private boolean badgeBestSeller;
    private boolean badgePromo;
    private boolean badgeExclusif;

    // Visibility
    private boolean visibleSite;
    private boolean visibleCategory;
    private boolean pinnedInSubCategory;

    // SEO
    private String metaTitle;

    // Cosmetics-specific
    private String latin;
    private boolean bio;
    private String origine;
    private String usageInstructions;
    private String precautions;
    private String inciComposition;
    private String certifications;
    private String volumes;

    // Clothing-specific
    private String tissu;
    private String couleur;
    private String couleurHex;
    private String coupe;
    private String col;
    private String manches;
    private String entretien;
    private String tailles;
    private String saison;
    private String genre;
    private String attributes;

    // Shipping
    private double weight;
    private double dimensionLength;
    private double dimensionWidth;
    private double dimensionHeight;
    private boolean specificFees;

    // Performance
    private String performance;

    // Media
    private String imageUrl;
    private String images;

    // Upsell
    private String upsellTags;

    // Variant rows
    private List<ProductVariantResponse> variants;

    // Audit
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Data
    @Builder
    @AllArgsConstructor
    public static class ProductVariantResponse {
        private Long id;
        private String label;
        private String colorSwatch;
        private String sku;
        private double price;
        private int stock;
    }
}
