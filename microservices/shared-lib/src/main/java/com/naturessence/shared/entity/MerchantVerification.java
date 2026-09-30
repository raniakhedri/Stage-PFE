package com.naturessence.shared.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/** A merchant's identity check, reviewed by the Sellio platform admin before the shop opens. */
@Entity
@Table(name = "merchant_verifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MerchantVerification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private Long shopId;

    /** CIN or PASSPORT */
    @Column(nullable = false, length = 20)
    private String documentType;

    @Column(nullable = false, length = 40)
    private String documentNumber;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String documentFront;

    @Column(columnDefinition = "TEXT")
    private String documentBack;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String selfie;

    private String cardholderName;
    private String cardBrand;
    @Column(length = 4)
    private String cardLast4;
    private Integer cardExpMonth;
    private Integer cardExpYear;
    private String stripePaymentMethodId;
    private String stripeSetupIntentId;

    /** PENDING, APPROVED or REJECTED */
    @Column(nullable = false, length = 20)
    private String status;

    @Column(columnDefinition = "TEXT")
    private String rejectionReason;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime submittedAt;

    private LocalDateTime reviewedAt;
    private String reviewedBy;
}
