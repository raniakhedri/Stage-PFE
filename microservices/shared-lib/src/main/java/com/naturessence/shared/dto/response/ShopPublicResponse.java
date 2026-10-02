package com.naturessence.shared.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShopPublicResponse {

    private String name;
    private String slug;
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
    private String theme;
    private String settings;
    private String status;
}
