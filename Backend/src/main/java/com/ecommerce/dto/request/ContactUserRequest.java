package com.ecommerce.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ContactUserRequest {

    @NotBlank(message = "Le sujet est obligatoire")
    @Size(max = 200, message = "Le sujet ne peut pas dépasser 200 caractères")
    private String subject;

    @NotBlank(message = "Le message est obligatoire")
    @Size(max = 5000, message = "Le message ne peut pas dépasser 5000 caractères")
    private String message;
}
