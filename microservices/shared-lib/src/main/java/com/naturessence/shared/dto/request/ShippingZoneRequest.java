package com.naturessence.shared.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ShippingZoneRequest {
    @NotBlank
    private String nom;

    @NotBlank
    private String regions;

    private String methode;
    private String estimation;

    @NotNull
    private Double cout;

    private String statut;
}
