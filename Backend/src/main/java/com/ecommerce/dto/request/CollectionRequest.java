package com.ecommerce.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class CollectionRequest {

    @NotBlank(message = "Le nom est obligatoire")
    private String nom;

    private String slug;

    private String description;

    private String imageUrl;
    private String bannerUrl;
    private String mobileImageUrl;

    private String type = "manuel";

    private String tags;
    private Double prixMax;
    private String performance = "standard";

    private String statut = "active";
    private boolean featured = false;
    private int priorite = 0;

    private boolean visHomepage = true;
    private boolean visMenu = true;
    private boolean visMobile = true;

    private LocalDate dateDebut;
    private LocalDate dateFin;

    private boolean menuFeatured = false;

    private String menuParentCategory;

    private String homepagePosition;

    private List<String> linkedCategories;

    private String metaTitle;
    private String metaDescription;
}
