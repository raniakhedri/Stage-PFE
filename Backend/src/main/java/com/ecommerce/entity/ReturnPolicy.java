package com.ecommerce.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "return_policy")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReturnPolicy {

    @Id
    private Long id; // always 1 — singleton row

    private Integer dureeJours;

    private String eligibilite;

    private String modeRemboursement;

    private String fraisRetour;

    @Column(columnDefinition = "TEXT")
    private String conditionsSpeciales;
}
