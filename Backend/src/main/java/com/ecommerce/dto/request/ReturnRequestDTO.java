package com.ecommerce.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ReturnRequestDTO {

    @NotNull
    private Long orderId;

    @NotNull
    private Long orderItemId;

    @NotBlank
    private String raison;

    private String commentaire;

    private String photo1;

    private String photo2;

    private String ibanClient;
}
