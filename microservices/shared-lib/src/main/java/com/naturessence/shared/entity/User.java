package com.naturessence.shared.entity;

import com.naturessence.shared.enums.AccountStatus;
import com.naturessence.shared.enums.Gender;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String firstName;

    @Column(nullable = false)
    private String lastName;

    /**
     * Unique among merchants, team members and platform accounts. A customer account belongs to one shop,
     * so the same e-mail can have one customer account per shop (enforced by partial unique indexes).
     */
    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    private String phone;

    private LocalDate dateOfBirth;

    @Enumerated(EnumType.STRING)
    private Gender gender;

    // ── Address fields (completed in Profile) ──
    private String address;
    private String city;
    private String postalCode;
    private String gouvernorat;
    private String country;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AccountStatus status = AccountStatus.ACTIVE;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "segment_id", nullable = false)
    private Segment segment;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    private String note;

    /** Persisted cart (JSON array of cart items) for cross-browser sync */
    @Column(columnDefinition = "TEXT")
    private String cartJson;

    /** Accumulated loyalty points */
    @Builder.Default
    private Integer loyaltyPoints = 0;

    /** Set when an account is created from the backoffice: the emailed password works once, then must be replaced. */
    @Builder.Default
    private Boolean mustChangePassword = false;

    /** Shop this account belongs to. One shop per merchant. Customers belong to one shop. */
    @Column(name = "shop_id")
    private Long shopId;

    private LocalDateTime lastLogin;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public String getFullName() {
        return firstName + " " + lastName;
    }
}
