package com.ecommerce.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "appearance_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppearanceSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ── Scope: "backoffice" or "frontoffice" ─────────────────────────
    @Column(nullable = false, unique = true)
    private String scope;

    // ── Couleurs ─────────────────────────────────────────────────────
    private String primaryColor;
    private String secondaryColor;
    private String buttonColor;
    private String sidebarColor;
    private String badgeColor;

    // ── Typographie ──────────────────────────────────────────────────
    private String fontPrimary;
    private String fontSecondary;
    private String fontSidebar;
    private String fontButton;
    private String fontBadge;

    // ── Logos (base64 ou URL) ────────────────────────────────────────
    @Column(columnDefinition = "TEXT")
    private String logoMain;
    @Column(columnDefinition = "TEXT")
    private String logoLight;
    @Column(columnDefinition = "TEXT")
    private String favicon;
    @Column(columnDefinition = "TEXT")
    private String loader;

    // ── Réglages Menu (backoffice) ───────────────────────────────────
    private String sidebarStyle;
    @Builder.Default
    private boolean showIcons = true;
    @Builder.Default
    private boolean showLogo = true;

    // ── Avancé ───────────────────────────────────────────────────────
    @Builder.Default
    private int borderRadius = 12;
    @Builder.Default
    private boolean darkMode = false;
    @Builder.Default
    private boolean animations = true;

    // ── Identité de la Marque (frontoffice uniquement) ───────────────
    private String brandName;
    private String domain;
    private String phone;
    private String email;
    @Column(columnDefinition = "TEXT")
    private String slogan;

    // ── Réseaux Sociaux (frontoffice uniquement) ─────────────────────
    private String instagram;
    private String facebook;
    private String linkedin;
    private String whatsapp;

    // ── Timestamps ───────────────────────────────────────────────────
    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
