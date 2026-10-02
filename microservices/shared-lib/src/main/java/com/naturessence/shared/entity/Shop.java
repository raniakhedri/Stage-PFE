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

    public static final String PENDING = "PENDING";
    public static final String ACTIVE = "ACTIVE";
    public static final String REJECTED = "REJECTED";
    public static final String SUSPENDED = "SUSPENDED";

    /** Shops created before verification existed have no status and count as active. */
    public static String statusOf(Shop shop) {
        return shop.getStatus() == null || shop.getStatus().isBlank() ? ACTIVE : shop.getStatus();
    }

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

    /** Detailed storefront colours as JSON, e.g. {"navbarBg":"#111111","buttonHoverBg":"#333333"}. */
    @Column(columnDefinition = "TEXT")
    private String theme;

    /**
     * Merchant customization as JSON: logo size, identity and social links, announcement bar, homepage
     * (sections, order, texts, featured products) and backoffice colours. Read by the storefront and the backoffice.
     */
    @Column(columnDefinition = "TEXT")
    private String settings;

    /** PENDING until the platform validates the owner's identity, then ACTIVE; SUSPENDED when blocked. */
    @Column(length = 20)
    private String status;

    /** User id of the merchant who owns this shop. Null for the seeded NaturEssence shop. */
    private Long ownerId;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
