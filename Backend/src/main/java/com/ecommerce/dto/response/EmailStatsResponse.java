package com.ecommerce.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class EmailStatsResponse {
    private long totalClients;
    private long activeClients;
    private long newThisMonth;
    private List<SegmentCount> segmentBreakdown;

    @Data
    @Builder
    public static class SegmentCount {
        private String segmentName;
        private String segmentLabel;
        private long count;
    }
}
