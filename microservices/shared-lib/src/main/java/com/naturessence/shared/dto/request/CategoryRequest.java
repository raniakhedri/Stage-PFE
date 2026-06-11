package com.naturessence.shared.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CategoryRequest {

    @NotBlank(message = "Le nom est obligatoire")
    private String nom;

    private String slug;

    private String description;

    private String imageUrl;

    private Long parentId;

    private String type = "Principale";

    // Visibility
    private boolean visMenu = true;
    private boolean visHomepage = false;
    private boolean visMobile = false;
    private boolean visFooter = false;

    // Position & Order
    private int menuPosition = 1;
    private int displayOrder = 10;

    // Status
    private String statut = "actif";
    private boolean vedette = false;

    // Business badges
    private boolean badgeBestseller = false;
    private boolean badgeNouveau = false;
    private boolean badgePromo = false;

    // SEO
    private String metaTitle;
    private String metaDescription;
}
