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

    @Builder.Default
    private String alignement = "center";

    @Column(name = "image_url", columnDefinition = "TEXT")
    private String imageUrl;

    @Column(name = "mobile_image_url", columnDefinition = "TEXT")
    private String mobileImageUrl;

    @Column(name = "video_url", columnDefinition = "TEXT")
    private String videoUrl;

    @Column(name = "badge_texte")
    @Builder.Default
    private String badgeTexte = "Nouvelle Collection";

    @Column(name = "badge_bg_color")
    @Builder.Default
    private String badgeBgColor = "rgba(255,255,255,0.15)";

    @Column(name = "badge_text_color")
    @Builder.Default
    private String badgeTextColor = "#ffffff";

    @Column(name = "cta_texte")
    private String ctaTexte;

    @Column(name = "cta_type")
    @Builder.Default
    private String ctaType = "produit";

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

    @Column(name = "visible_homepage")
    @Builder.Default
    private Boolean visibleHomepage = true;

    @Column(name = "visible_mobile")
    @Builder.Default
    private Boolean visibleMobile = true;

    @Column(name = "visible_desktop")
    @Builder.Default
    private Boolean visibleDesktop = true;

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
