package com.ecommerce.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum BannerStatut {
    ACTIF("Actif"),
    BROUILLON("Brouillon"),
    PROGRAMME("Programmé"),
    EXPIRE("Expiré");

    private final String label;
}
