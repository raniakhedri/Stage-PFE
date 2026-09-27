package com.naturessence.shared.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "shops")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Shop {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String slug;

    /** CLOTHES or COSMETICS */
    @Column(nullable = false)
    private String businessType;

    @Column(nullable = false)
    private String templateKey;

    /** Optional storefront logo, data URL or remote URL. */
    @Column(columnDefinition = "TEXT")
    private String logo;

    /** Blank means the template colors stay as designed. */
    private String primaryColor;
    private String buttonColor;
    private String buttonTextColor;
    private String accentColor;
    private String backgroundColor;
    private String textColor;

    /** JSON map of merchant-defined catalog options, e.g. {"tissu":["Tweed"]}. */
    @Column(columnDefinition = "TEXT")
    private String customOptions;

    /** User id of the merchant who owns this shop. Null for the seeded NaturEssence shop. */
    private Long ownerId;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
