package com.ecommerce.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class AppearanceResponse {

    private Long id;
    private String scope;

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

    // Logos
    private String logoMain;
    private String logoLight;
    private String favicon;
    private String loader;

    // Réglages Menu
    private String sidebarStyle;
    private boolean showIcons;
    private boolean showLogo;

    // Avancé
    private int borderRadius;
    private boolean darkMode;
    private boolean animations;

    // Identité de la Marque
    private String brandName;
    private String domain;
    private String phone;
    private String email;
    private String slogan;

    // Réseaux Sociaux
    private String instagram;
    private String facebook;
    private String linkedin;
    private String whatsapp;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
