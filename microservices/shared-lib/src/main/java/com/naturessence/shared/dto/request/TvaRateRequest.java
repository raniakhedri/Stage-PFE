package com.naturessence.shared.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class TvaRateRequest {
    @NotBlank
    private String nom;

    @NotNull
    private Double valeur;
}
