package com.naturessence.shared.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class TvaRateResponse {
    private Long id;
    private String nom;
    private Double valeur;
    private Boolean actif;
}
