package com.naturessence.shared.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class OrderItemRequest {

    @NotNull
    private Long productId;

    @NotBlank
    private String productName;

    private String productSlug;

    private String color;

    private String size;

    private String image;

    /** Ignored by the server: the price is read from the catalogue. Kept for older clients. */
    @Min(0)
    private Double unitPrice;

    @NotNull
    @Min(1)
    private Integer quantity;
}
