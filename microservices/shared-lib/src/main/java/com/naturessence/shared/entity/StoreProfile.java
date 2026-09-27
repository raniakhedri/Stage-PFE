package com.naturessence.shared.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "store_profile")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StoreProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** COSMETICS or CLOTHES */
    @Column(nullable = false)
    @Builder.Default
    private String businessType = "COSMETICS";

    /** botanique, nude, atelier, noir */
    @Column(nullable = false)
    @Builder.Default
    private String templateKey = "botanique";

    @Builder.Default
    private boolean onboarded = false;

    private String storeName;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
