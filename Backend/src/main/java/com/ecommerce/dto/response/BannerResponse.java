package com.ecommerce.dto.response;

import com.ecommerce.enums.BannerAudience;
import com.ecommerce.enums.BannerPosition;
import com.ecommerce.enums.BannerStatut;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class BannerResponse {
    private Long id;
    private String titre;
    private String sousTitre;
    private String imageUrl;
    private String ctaTexte;
    private String ctaLien;
    private BannerPosition position;
    private String positionLabel;
    private BannerAudience audience;
    private String audienceLabel;
    private BannerStatut statut;
    private String statutLabel;
    private int priorite;
    private LocalDate dateDebut;
    private LocalDate dateFin;
    private boolean actif;
    private int ordre;
    private int dureeSecondes;
    private String animation;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
