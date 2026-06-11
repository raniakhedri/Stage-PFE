package com.naturessence.shared.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "categories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Category {

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

    // Hierarchy
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Category parent;

    @Builder.Default
    @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL)
    private List<Category> children = new ArrayList<>();

    @Column(nullable = false)
    @Builder.Default
    private String type = "Principale";

    // Visibility
    @Builder.Default
    private boolean visMenu = true;
    @Builder.Default
    private boolean visHomepage = false;
    @Builder.Default
    private boolean visMobile = false;
    @Builder.Default
    private boolean visFooter = false;

    // Position & Order
    @Builder.Default
    private int menuPosition = 1;
    @Builder.Default
    private int displayOrder = 10;

    // Status
    @Column(nullable = false)
    @Builder.Default
    private String statut = "actif";

    @Builder.Default
    private boolean vedette = false;

    // Business badges
    @Builder.Default
    private boolean badgeBestseller = false;
    @Builder.Default
    private boolean badgeNouveau = false;
    @Builder.Default
    private boolean badgePromo = false;

    // SEO
    private String metaTitle;
    private String metaDescription;

    // Audit
    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
