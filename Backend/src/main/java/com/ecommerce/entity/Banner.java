package com.ecommerce.entity;

import com.ecommerce.enums.BannerAudience;
import com.ecommerce.enums.BannerPosition;
import com.ecommerce.enums.BannerStatut;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "banners")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Banner {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String titre;

    @Column(name = "sous_titre")
    private String sousTitre;

    @Column(name = "image_url", columnDefinition = "TEXT")
    private String imageUrl;

    @Column(name = "cta_texte")
    private String ctaTexte;

    @Column(name = "cta_lien", columnDefinition = "TEXT")
    private String ctaLien;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private BannerPosition position = BannerPosition.HOMEPAGE_HERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private BannerAudience audience = BannerAudience.ALL;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private BannerStatut statut = BannerStatut.BROUILLON;

    @Builder.Default
    private int priorite = 2;

    @Column(name = "date_debut")
    private LocalDate dateDebut;

    @Column(name = "date_fin")
    private LocalDate dateFin;

    @Builder.Default
    private boolean actif = false;

    @Builder.Default
    private int ordre = 10;

    /** Durée d'affichage en secondes pour le slideshow frontoffice */
    @Column(name = "duree_secondes")
    @Builder.Default
    private int dureeSecondes = 5;

    /** Type d'animation du slideshow: fade, slide, zoom */
    @Builder.Default
    private String animation = "fade";

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
