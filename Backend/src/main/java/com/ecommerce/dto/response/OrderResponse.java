package com.ecommerce.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
public class OrderResponse {

    private Long id;
    private String reference;

    private Long userId;

    private String email;
    private String firstName;
    private String lastName;
    private String phone;

    private String address;
    private String city;
    private String postalCode;
    private String gouvernorat;

    private String shippingZoneName;
    private Double shippingCost;

    private Double subtotal;
    private Double tvaRate;
    private Double tvaAmount;
    private Double total;

    private String couponCode;
    private Double couponDiscount;

    private String paymentMethod;
    private String status;

    private List<OrderItemResponse> items;

    private LocalDateTime createdAt;
    private LocalDateTime deliveredAt;
}
