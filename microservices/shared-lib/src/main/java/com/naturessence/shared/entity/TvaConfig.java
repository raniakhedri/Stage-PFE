package com.naturessence.shared.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Singleton-style table (one row) holding global TVA/shipping config.
 */
@Entity
@Table(name = "tva_config")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TvaConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Global toggle for TVA */
    @Builder.Default
    private Boolean tvaActive = true;

    /** Default TVA rate (%) */
    @Builder.Default
    private Double tauxDefaut = 19.0;

    /** Reference currency label */
    @Builder.Default
    private String devise = "Dinar Tunisien (TND)";

    /* ── Shipping modes ── */

    @Builder.Default
    private Boolean standardEnabled = true;

    /** Free-shipping threshold for standard (in TND) */
    @Builder.Default
    private Double standardSeuil = 200.0;

    @Builder.Default
    private String standardDelai = "3 à 5 jours ouvrés";

    @Builder.Default
    private Boolean expressEnabled = true;

    /** Free-shipping threshold for express (in TND), null = none */
    private Double expressSeuil;

    @Builder.Default
    private String expressDelai = "24h à 48h";

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
