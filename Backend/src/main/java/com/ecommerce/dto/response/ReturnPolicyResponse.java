package com.ecommerce.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ReturnPolicyResponse {
    private Integer dureeJours;
    private String eligibilite;
    private String modeRemboursement;
    private String fraisRetour;
    private String conditionsSpeciales;
}
