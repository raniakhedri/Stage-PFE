package com.naturessence.shared.dto.request;

import com.naturessence.shared.enums.Gender;
import jakarta.validation.constraints.Past;
import lombok.Data;

import java.time.LocalDate;

@Data
public class UpdateProfileRequest {

    private String firstName;
    private String lastName;
    private String phone;

    @Past(message = "La date de naissance doit être dans le passé")
    private LocalDate dateOfBirth;

    private Gender gender;

    private String address;
    private String city;
    private String postalCode;
    private String gouvernorat;
    private String country;
}
