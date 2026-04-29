package com.ecommerce.dto.response;

import com.ecommerce.enums.AccountStatus;
import com.ecommerce.enums.Gender;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
@AllArgsConstructor
public class UserResponse {
    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private LocalDate dateOfBirth;
    private Gender gender;
    private String address;
    private String city;
    private String postalCode;
    private String gouvernorat;
    private String country;
    private AccountStatus status;
    private String segmentName;
    private String segmentLabel;
    private String roleName;
    private String roleLabel;
    private String note;
    private Integer loyaltyPoints;
    private LocalDateTime lastLogin;
    private LocalDateTime createdAt;
    private Map<String, Boolean> permissions;
}
