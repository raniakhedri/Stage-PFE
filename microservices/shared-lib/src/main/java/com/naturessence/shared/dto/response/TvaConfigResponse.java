package com.naturessence.shared.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class TvaConfigResponse {
    private Boolean tvaActive;
    private Double tauxDefaut;
    private String devise;

    private Boolean standardEnabled;
    private Double standardSeuil;
    private String standardDelai;

    private Boolean expressEnabled;
    private Double expressSeuil;
    private String expressDelai;
}
