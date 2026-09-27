package com.naturessence.shared.dto.request;

import lombok.Data;

@Data
public class StoreProfileRequest {
    private String businessType;
    private String templateKey;
    private Boolean onboarded;
    private String storeName;
}
