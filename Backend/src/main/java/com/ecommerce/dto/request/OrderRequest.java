package com.ecommerce.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class OrderRequest {

    @NotBlank
    @Email
    private String email;

    @NotBlank
    private String firstName;

    @NotBlank
    private String lastName;

    @NotBlank
    private String phone;

    @NotBlank
    private String address;

    @NotBlank
    private String city;

    @NotBlank
    private String postalCode;

    private String gouvernorat;

    @NotBlank
    private String shippingZoneName;

    @NotBlank
    private String paymentMethod; // CARTE or ESPECES_LIVRAISON

    private String couponCode;

    private Long userId; // optional — set when user is logged in

    @NotEmpty
    @Valid
    private List<OrderItemRequest> items;
}
