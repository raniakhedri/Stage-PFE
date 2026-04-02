package com.ecommerce.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
public class CollectionResponse {
    private Long id;
    private String nom;
    private String slug;
    private String description;
    private String imageUrl;
    private String bannerUrl;
    private String mobileImageUrl;

    private String type;
    private String tags;
    private Double prixMax;
    private String performance;

    private String statut;
    private boolean featured;
    private int priorite;

    private boolean visHomepage;
    private boolean visMenu;
    private boolean visMobile;

    private LocalDate dateDebut;
    private LocalDate dateFin;

    private boolean menuFeatured;

    private String menuParentCategory;

    private String homepagePosition;

    private List<String> linkedCategories;

    private String metaTitle;
    private String metaDescription;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
