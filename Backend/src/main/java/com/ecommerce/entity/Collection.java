package com.ecommerce.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "collections")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Collection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nom;

    @Column(nullable = false, unique = true)
    private String slug;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "image_url", columnDefinition = "TEXT")
    private String imageUrl;

    @Column(name = "banner_url", columnDefinition = "TEXT")
    private String bannerUrl;

    @Column(name = "mobile_image_url", columnDefinition = "TEXT")
    private String mobileImageUrl;

    // Type: "manuel" or "auto"
    @Column(nullable = false)
    @Builder.Default
    private String type = "manuel";

    private String tags;

    @Column(name = "prix_max")
    private Double prixMax;

    @Column(nullable = false)
    @Builder.Default
    private String performance = "standard";

    // Status
    @Column(nullable = false)
    @Builder.Default
    private String statut = "active";

    @Builder.Default
    private boolean featured = false;

    @Builder.Default
    private int priorite = 0;

    // Visibility
    @Builder.Default
    private boolean visHomepage = true;
    @Builder.Default
    private boolean visMenu = true;
    @Builder.Default
    private boolean visMobile = true;

    // Period
    private LocalDate dateDebut;
    private LocalDate dateFin;

    // Homepage bento position: null (off), 'principale', 'secondaire-haut',
    // 'secondaire-bas'
    @Column(name = "homepage_position")
    private String homepagePosition;

    // Featured in the menu (2 per parent category shown as images)
    @Column(name = "menu_featured", columnDefinition = "boolean default false")
    @Builder.Default
    private boolean menuFeatured = false;

    // Which parent category this collection appears under in the front-office menu
    @Column(name = "menu_parent_category")
    private String menuParentCategory;

    // Linked categories stored as "||"-delimited text
    @Column(name = "linked_categories", columnDefinition = "TEXT")
    private String linkedCategories;

    // SEO
    private String metaTitle;
    private String metaDescription;

    // Audit
    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
