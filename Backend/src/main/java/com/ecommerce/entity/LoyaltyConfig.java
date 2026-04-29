package com.ecommerce.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Singleton-style table (one row) holding global loyalty/points programme config.
 */
@Entity
@Table(name = "loyalty_config")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoyaltyConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Points awarded per TND spent on a delivered order */
    @Builder.Default
    private Double pointsParTnd = 1.0;

    /** Bonus points awarded when a new account registers */
    @Builder.Default
    private Integer pointsBienvenue = 50;

    /** Bonus points awarded each time a client submits a review */
    @Builder.Default
    private Integer pointsAvis = 20;

    /** Bonus points awarded in the client's birthday month */
    @Builder.Default
    private Integer pointsAnniversaire = 100;

    /** When true, clients are automatically promoted to higher segments
     *  once their accumulated points pass the segment's seuilPoints */
    @Builder.Default
    private Boolean autoSegmentPromotion = true;
}
