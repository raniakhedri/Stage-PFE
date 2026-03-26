package com.ecommerce.dto.request;

import lombok.Data;

@Data
public class AppearanceRequest {

    // Couleurs
    private String primaryColor;
    private String secondaryColor;
    private String buttonColor;
    private String sidebarColor;
    private String badgeColor;

    // Typographie
    private String fontPrimary;
    private String fontSecondary;
    private String fontSidebar;
    private String fontButton;
    private String fontBadge;

    // Logos (base64 ou URL)
    private String logoMain;
    private String logoLight;
    private String favicon;
    private String loader;

    // Réglages Menu (backoffice)
    private String sidebarStyle;
    private Boolean showIcons;
    private Boolean showLogo;

    // Avancé
    private Integer borderRadius;
    private Boolean darkMode;
    private Boolean animations;

    // Identité de la Marque (frontoffice)
    private String brandName;
    private String domain;
    private String phone;
    private String email;
    private String slogan;

    // Réseaux Sociaux (frontoffice)
    private String instagram;
    private String facebook;
    private String linkedin;
    private String whatsapp;
}
