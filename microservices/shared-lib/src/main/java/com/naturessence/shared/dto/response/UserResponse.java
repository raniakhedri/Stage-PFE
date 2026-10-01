package com.naturessence.shared.dto.response;

import com.naturessence.shared.enums.AccountStatus;
import com.naturessence.shared.enums.Gender;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
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
    private Long shopId;
    private String shopSlug;
    private String shopName;
    private String businessType;
    private String templateKey;
    private String shopStatus;
    private Long roleId;
    /** True for team members whose role was created by the merchant (permissions limited). */
    private Boolean staff;
    /** True for the account that created the shop. */
    private Boolean shopOwner;
    private Boolean mustChangePassword;
}
