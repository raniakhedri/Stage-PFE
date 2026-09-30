package com.naturessence.shared.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlatformShopResponse {

    private Long id;
    private String name;
    private String slug;
    private String businessType;
    private String templateKey;
    private String logo;
    private String primaryColor;
    private String accentColor;
    private String backgroundColor;
    private LocalDateTime createdAt;
    private String status;

    private Long ownerId;
    private String ownerEmail;
    private String ownerName;
    private String ownerPhone;
    private String ownerStatus;
    private LocalDateTime ownerLastLogin;

    private long clientCount;
    private long productCount;
    private long orderCount;
    private double revenue;
    private LocalDateTime lastOrderAt;
}
