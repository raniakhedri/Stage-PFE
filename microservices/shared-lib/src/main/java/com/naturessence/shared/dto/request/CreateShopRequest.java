package com.naturessence.shared.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateShopRequest {

    @NotBlank(message = "Le nom de la boutique est obligatoire")
    private String name;

    @NotBlank(message = "Le type d'activité est obligatoire")
    private String businessType;

    private String templateKey;

    private String logo;
    private String primaryColor;
    private String buttonColor;
    private String buttonTextColor;
    private String accentColor;
    private String backgroundColor;
    private String textColor;
    private String customOptions;
}
