package com.ecommerce.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ReturnResponse {
    private Long id;
    private String reference;
    private Long orderId;
    private String orderReference;
    private Long orderItemId;
    private Long productId;
    private String productName;
    private String productImage;
    private Double amount;
    private String customerName;
    private String customerEmail;
    private String raison;
    private String commentaire;
    private String photo1;
    private String photo2;
    private String ibanClient;
    private String status;
    private String motifRefus;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
