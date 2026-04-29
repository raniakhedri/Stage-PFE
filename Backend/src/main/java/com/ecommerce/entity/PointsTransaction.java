package com.ecommerce.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "points_transactions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PointsTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** Order ID (nullable — welcome / review / adjustment have no order) */
    private Long orderId;

    /** COMMANDE | AVIS | BIENVENUE | ANNIVERSAIRE | AJUSTEMENT */
    @Column(nullable = false)
    private String type;

    /** Positive = earn, negative = deduction */
    @Column(nullable = false)
    private int points;

    private String description;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
