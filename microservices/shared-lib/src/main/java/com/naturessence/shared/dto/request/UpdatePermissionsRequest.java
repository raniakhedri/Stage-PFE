package com.naturessence.shared.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.Map;

@Data
public class UpdatePermissionsRequest {

    @NotNull(message = "Les permissions sont obligatoires")
    private Map<String, Boolean> permissions;
}
