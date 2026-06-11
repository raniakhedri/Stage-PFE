package com.naturessence.shared.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
@Builder
@AllArgsConstructor
public class RoleResponse {
    private Long id;
    private String name;
    private String label;
    private String description;
    private long userCount;
    private Map<String, Boolean> permissions;
}
