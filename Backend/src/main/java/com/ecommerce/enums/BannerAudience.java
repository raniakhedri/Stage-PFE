package com.ecommerce.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum BannerAudience {
    ALL("Tous les visiteurs"),
    NOUVEAU("Nouveaux clients"),
    FIDELE("Clients fidèles"),
    VIP("Clients VIP"),
    INACTIF("Clients inactifs");

    private final String label;
}
