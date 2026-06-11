package com.naturessence.shared.dto.request;

import com.naturessence.shared.enums.AccountStatus;
import com.naturessence.shared.enums.Gender;
import jakarta.validation.constraints.Email;
import lombok.Data;

import java.time.LocalDate;

@Data
public class UpdateUserRequest {

    private String firstName;
    private String lastName;

    @Email(message = "Format d'email invalide")
    private String email;

    private String phone;
    private LocalDate dateOfBirth;
    private Gender gender;

    private String address;
    private String city;
    private String postalCode;
    private String country;

    private AccountStatus status;
    private String segment;
    private String role;
    private String note;
}
