package com.ecommerce.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PointsTransactionResponse {
    private Long id;
    private String type;
    private int points;
    private String description;
    private Long orderId;
    private LocalDateTime createdAt;
}
