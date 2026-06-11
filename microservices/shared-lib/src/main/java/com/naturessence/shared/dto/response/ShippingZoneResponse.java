package com.naturessence.shared.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class ShippingZoneResponse {
    private Long id;
    private String nom;
    private String regions;
    private String methode;
    private String estimation;
    private Double cout;
    private String statut;
}
