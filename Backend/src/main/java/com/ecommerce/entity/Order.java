package com.ecommerce.entity;

import com.ecommerce.enums.OrderStatus;
import com.ecommerce.enums.PaymentMethod;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String reference;

    // ── Customer info (guest or logged-in) ──
    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String firstName;

    @Column(nullable = false)
    private String lastName;

    private String phone;

    // ── Shipping address ──
    @Column(nullable = false)
    private String address;

    @Column(nullable = false)
    private String city;

    @Column(nullable = false)
    private String postalCode;

    private String gouvernorat;

    // ── Shipping zone ──
    @Column(nullable = false)
    private String shippingZoneName;

    @Column(nullable = false)
    @Builder.Default
    private Double shippingCost = 0.0;

    // ── Totals ──
    @Column(nullable = false)
    @Builder.Default
    private Double subtotal = 0.0;

    @Column(nullable = false)
    @Builder.Default
    private Double tvaRate = 0.0;

    @Column(nullable = false)
    @Builder.Default
    private Double tvaAmount = 0.0;

    @Column(nullable = false)
    @Builder.Default
    private Double total = 0.0;

    // ── Coupon ──
    private String couponCode;

    @Builder.Default
    private Double couponDiscount = 0.0;

    // ── Payment ──
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentMethod paymentMethod;

    // ── Status ──
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private OrderStatus status = OrderStatus.EN_ATTENTE;

    // ── Items ──
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<OrderItem> items = new ArrayList<>();

    // ── Optional: linked user ──
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "delivered_at")
    private LocalDateTime deliveredAt;
}
