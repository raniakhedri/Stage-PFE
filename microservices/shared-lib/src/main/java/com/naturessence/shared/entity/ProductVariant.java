package com.naturessence.shared.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "product_variants")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductVariant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    /** e.g. "Noir - S" */
    private String label;

    /** Tailwind bg-class or hex colour string */
    private String colorSwatch;

    private String sku;

    @Builder.Default
    private double price = 0;

    @Builder.Default
    private int stock = 0;
}
