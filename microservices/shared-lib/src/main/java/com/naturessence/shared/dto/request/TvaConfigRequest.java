package com.naturessence.shared.dto.request;

import lombok.Data;

@Data
public class TvaConfigRequest {
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
