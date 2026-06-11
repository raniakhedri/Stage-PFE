package com.naturessence.shared.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.Map;

@Data
public class RoleRequest {

    @NotBlank(message = "Le nom du rôle est obligatoire")
    private String name;

    @NotBlank(message = "Le libellé du rôle est obligatoire")
    private String label;

    private String description;

    /**
     * Map of permission module name -> granted (true/false).
     * Example: {"TABLEAU_DE_BORD": true, "PRODUITS_CATEGORIES": false}
     */
    private Map<String, Boolean> permissions;
}
