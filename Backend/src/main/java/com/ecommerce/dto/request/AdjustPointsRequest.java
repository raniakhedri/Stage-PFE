package com.ecommerce.dto.request;

import lombok.Data;

@Data
public class AdjustPointsRequest {
    private int delta;   // can be negative to deduct
    private String reason;
}
