package com.naturessence.shared.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class StoreProfileResponse {
    private String businessType;
    private String templateKey;
    private boolean onboarded;
    private String storeName;
}
