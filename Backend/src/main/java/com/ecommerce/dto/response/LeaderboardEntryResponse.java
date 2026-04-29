package com.ecommerce.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class LeaderboardEntryResponse {
    private Long userId;
    private String fullName;
    private String email;
    private int loyaltyPoints;
    private String segmentLabel;
    private String segmentColor;
    private int rank;
}
