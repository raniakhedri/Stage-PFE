package com.naturessence.shared.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum PermissionModule {
    // Navigation principale
    TABLEAU_DE_BORD("Tableau de bord"),
    PRODUITS("Produits"),
    COMMANDES("Commandes"),
    RETOURS("Retours"),
    CLIENTS("Clients"),
    ANALYSES("Analyses"),
    COLLECTIONS("Collections"),
    CATEGORIES("Catégories"),
    BANNIERES("Bannières"),
    TVA_LIVRAISON("TVA & Livraison"),
    // Marketing
    PROMOTIONS("Promotions"),
    EMAIL_MARKETING("Email Marketing"),
    AVIS("Avis"),
    // Paramètres
    APPARENCE("Apparence"),
    ROLES_PERMISSIONS("Rôles & Permissions"),
    COMPTE_HEBERGEMENT("Compte & Hébergement");

    private final String label;
}
