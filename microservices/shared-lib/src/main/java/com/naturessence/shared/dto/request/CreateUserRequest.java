package com.naturessence.shared.dto.request;

import com.naturessence.shared.enums.Gender;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
public class CreateUserRequest {

    @NotBlank(message = "Le prénom est obligatoire")
    private String firstName;

    @NotBlank(message = "Le nom est obligatoire")
    private String lastName;

    @NotBlank(message = "L'email est obligatoire")
    @Email(message = "Format d'email invalide")
    private String email;

    @Size(min = 8, message = "Le mot de passe doit contenir au moins 8 caractères")
    private String password;

    private String phone;

    private LocalDate dateOfBirth;

    private Gender gender;

    private String address;
    private String city;
    private String postalCode;
    private String country;

    @NotBlank(message = "Le rôle est obligatoire")
    private String role;

    private String note;

    private String segment;

    private boolean sendInvite;
}
