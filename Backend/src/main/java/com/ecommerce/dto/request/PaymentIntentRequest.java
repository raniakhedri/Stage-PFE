package com.ecommerce.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class PaymentIntentRequest {

    @NotNull
    @Min(0)
    private Double amount; // in TND

    @NotBlank
    private String orderReference;
}
