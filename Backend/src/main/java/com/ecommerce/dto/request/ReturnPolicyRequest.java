package com.ecommerce.dto.request;

import lombok.Data;

@Data
public class ReturnPolicyRequest {
    private Integer dureeJours;
    private String eligibilite;
    private String modeRemboursement;
    private String fraisRetour;
    private String conditionsSpeciales;
}
