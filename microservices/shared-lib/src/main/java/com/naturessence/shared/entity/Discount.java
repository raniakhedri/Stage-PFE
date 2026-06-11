package com.naturessence.shared.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "discounts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Discount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Optional label for tracking */
    private String nom;

    /** Dynamic type: pourcentage, fixe */
    @Column(nullable = false)
    private String type;

    /** Discount value (percentage or fixed amount) */
    private double valeur;

    /** Target product ID (for future link) */
    private Long productId;

    /** Target product name (for display before Product entity exists) */
    private String productName;

    /** Target category — link to existing Category entity */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    /** Original price (snapshot at discount creation) */
    @Builder.Default
    private double prixOriginal = 0;

    /** Computed final price */
    @Builder.Default
    private double prixFinal = 0;

    /** Dynamic status: actif, inactif, expire, planifie */
    @Column(nullable = false)
    @Builder.Default
    private String statut = "actif";

    /** Validity period */
    private LocalDate dateDebut;
    private LocalDate dateFin;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
