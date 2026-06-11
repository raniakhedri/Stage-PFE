package com.naturessence.shared.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
public class CategoryResponse {
    private Long id;
    private String nom;
    private String slug;
    private String description;
    private String imageUrl;

    // Hierarchy
    private Long parentId;
    private String parentNom;
    private String type;
    private int niveau;
    private long childrenCount;
    private List<CategoryResponse> children;

    // Visibility
    private boolean visMenu;
    private boolean visHomepage;
    private boolean visMobile;
    private boolean visFooter;

    // Position & Order
    private int menuPosition;
    private int displayOrder;

    // Status
    private String statut;
    private boolean vedette;

    // Business badges
    private boolean badgeBestseller;
    private boolean badgeNouveau;
    private boolean badgePromo;

    // SEO
    private String metaTitle;
    private String metaDescription;

    // Audit
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
