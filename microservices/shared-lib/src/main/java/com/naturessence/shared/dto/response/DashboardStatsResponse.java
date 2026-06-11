package com.naturessence.shared.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class DashboardStatsResponse {
    private long totalClients;
    private long activeClients;
    private long newClientsLast30Days;
    private long fideleClients;
    private long totalAdmins;
    private long rolesCount;
}
