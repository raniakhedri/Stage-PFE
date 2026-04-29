package com.ecommerce.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class LoyaltyInfoResponse {
    private int points;
    private SegmentResponse currentSegment;
    private SegmentResponse nextSegment; // null if already at highest tier
    private List<PointsTransactionResponse> history;
}
