package com.ecommerce.entity;

import com.ecommerce.enums.ReturnStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "return_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReturnRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String reference;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Column(nullable = false)
    private Long orderItemId;

    // Product info snapshot
    @Column(nullable = false)
    private Long productId;

    @Column(nullable = false)
    private String productName;

    @Column(columnDefinition = "TEXT")
    private String productImage;

    @Column(nullable = false)
    private Double amount;

    // Customer info
    @Column(nullable = false)
    private String customerName;

    @Column(nullable = false)
    private String customerEmail;

    // Return details
    @Column(nullable = false)
    private String raison;

    @Column(columnDefinition = "TEXT")
    private String commentaire;

    @Column(columnDefinition = "TEXT")
    private String photo1;

    @Column(columnDefinition = "TEXT")
    private String photo2;

    @Column(columnDefinition = "TEXT")
    private String ibanClient;

    @Column(columnDefinition = "TEXT")
    private String motifRefus;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ReturnStatus status = ReturnStatus.EN_ATTENTE;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
