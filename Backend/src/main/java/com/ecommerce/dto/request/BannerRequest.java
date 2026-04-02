package com.ecommerce.dto.request;

import com.ecommerce.enums.BannerAudience;
import com.ecommerce.enums.BannerPosition;
import com.ecommerce.enums.BannerStatut;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class BannerRequest {

    @NotBlank(message = "Le titre est obligatoire")
    private String titre;

    private String sousTitre;

    private String imageUrl;

    private String ctaTexte;

    private String ctaLien;

    @NotNull(message = "La position est obligatoire")
    private BannerPosition position;

    @NotNull(message = "L'audience est obligatoire")
    private BannerAudience audience;

    @NotNull(message = "Le statut est obligatoire")
    private BannerStatut statut;

    private int priorite = 2;

    private LocalDate dateDebut;

    private LocalDate dateFin;

    private boolean actif = false;

    private int ordre = 10;

    /** Durée d'affichage en secondes (slideshow). Défaut: 5 */
    private int dureeSecondes = 5;

    /** Type d'animation: fade, slide, zoom. Défaut: fade */
    private String animation = "fade";
}
