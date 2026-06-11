package com.naturessence.shared.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class PermissionDTO {
    private Long id;
    private String module;
    private String label;
    private boolean granted;
}
