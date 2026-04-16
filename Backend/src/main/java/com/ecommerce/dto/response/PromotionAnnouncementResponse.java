package com.ecommerce.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class PromotionAnnouncementResponse {
    private String source;
    private String message;
    private String code;
    private String type;
    private Double valeur;
    private Double montantMin;
}
