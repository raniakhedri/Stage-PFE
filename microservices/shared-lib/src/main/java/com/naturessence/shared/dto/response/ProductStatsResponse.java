package com.naturessence.shared.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class ProductStatsResponse {
    private long total;
    private long actifs;
    private long archives;
    private long desactives;
    private long rupture;
    private long enPromo;
}
