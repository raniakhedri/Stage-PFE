package com.ecommerce.service;

import com.ecommerce.dto.request.AppearanceRequest;
import com.ecommerce.dto.response.AppearanceResponse;
import com.ecommerce.entity.AppearanceSettings;
import com.ecommerce.repository.AppearanceSettingsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AppearanceService {

    private final AppearanceSettingsRepository repository;

    // ── Get settings by scope ──────────────────────────────────────────
    @Transactional
    public AppearanceResponse getByScope(String scope) {
        AppearanceSettings entity = repository.findByScope(scope)
                .orElseGet(() -> createDefault(scope));
        return mapToResponse(entity);
    }

    // ── Update settings by scope ───────────────────────────────────────
    @Transactional
    public AppearanceResponse updateByScope(String scope, AppearanceRequest request) {
        AppearanceSettings entity = repository.findByScope(scope)
                .orElseGet(() -> createDefault(scope));

        // Couleurs
        if (request.getPrimaryColor() != null)
            entity.setPrimaryColor(request.getPrimaryColor());
        if (request.getSecondaryColor() != null)
            entity.setSecondaryColor(request.getSecondaryColor());
        if (request.getButtonColor() != null)
            entity.setButtonColor(request.getButtonColor());
        if (request.getButtonHoverColor() != null)
            entity.setButtonHoverColor(request.getButtonHoverColor());
        if (request.getButtonTextColor() != null)
            entity.setButtonTextColor(request.getButtonTextColor());
        if (request.getSidebarColor() != null)
            entity.setSidebarColor(request.getSidebarColor());
        if (request.getBadgeColor() != null)
            entity.setBadgeColor(request.getBadgeColor());

        // Typographie
        if (request.getFontPrimary() != null)
            entity.setFontPrimary(request.getFontPrimary());
        if (request.getFontSecondary() != null)
            entity.setFontSecondary(request.getFontSecondary());
        if (request.getFontSidebar() != null)
            entity.setFontSidebar(request.getFontSidebar());
        if (request.getFontButton() != null)
            entity.setFontButton(request.getFontButton());
        if (request.getFontBadge() != null)
            entity.setFontBadge(request.getFontBadge());

        // Logos
        if (request.getLogoMain() != null)
            entity.setLogoMain(request.getLogoMain());
        if (request.getLogoLight() != null)
            entity.setLogoLight(request.getLogoLight());
        if (request.getLogoNavbar() != null)
            entity.setLogoNavbar(request.getLogoNavbar());
        if (request.getFavicon() != null)
            entity.setFavicon(request.getFavicon());
        if (request.getLoader() != null)
            entity.setLoader(request.getLoader());

        // Réglages Menu
        if (request.getSidebarStyle() != null)
            entity.setSidebarStyle(request.getSidebarStyle());
        if (request.getShowIcons() != null)
            entity.setShowIcons(request.getShowIcons());
        if (request.getShowLogo() != null)
            entity.setShowLogo(request.getShowLogo());

        // Logo Scale
        if (request.getLogoScale() != null)
            entity.setLogoScale(request.getLogoScale());
        if (request.getLogoAlign() != null)
            entity.setLogoAlign(request.getLogoAlign());

        // Avancé
        if (request.getBorderRadius() != null)
            entity.setBorderRadius(request.getBorderRadius());
        if (request.getDarkMode() != null)
            entity.setDarkMode(request.getDarkMode());
        if (request.getAnimations() != null)
            entity.setAnimations(request.getAnimations());

        // Identité de la Marque (frontoffice)
        if (request.getBrandName() != null)
            entity.setBrandName(request.getBrandName());
        if (request.getDomain() != null)
            entity.setDomain(request.getDomain());
        if (request.getPhone() != null)
            entity.setPhone(request.getPhone());
        if (request.getEmail() != null)
            entity.setEmail(request.getEmail());
        if (request.getSlogan() != null)
            entity.setSlogan(request.getSlogan());

        // Réseaux Sociaux (frontoffice)
        if (request.getInstagram() != null)
            entity.setInstagram(request.getInstagram());
        if (request.getFacebook() != null)
            entity.setFacebook(request.getFacebook());
        if (request.getLinkedin() != null)
            entity.setLinkedin(request.getLinkedin());
        if (request.getWhatsapp() != null)
            entity.setWhatsapp(request.getWhatsapp());

        return mapToResponse(repository.save(entity));
    }

    // ── Reset to defaults ──────────────────────────────────────────────
    @Transactional
    public AppearanceResponse resetByScope(String scope) {
        repository.findByScope(scope).ifPresent(repository::delete);
        AppearanceSettings fresh = createDefault(scope);
        return mapToResponse(fresh);
    }

    // ── Helpers ────────────────────────────────────────────────────────
    private AppearanceSettings createDefault(String scope) {
        AppearanceSettings settings = AppearanceSettings.builder()
                .scope(scope)
                .primaryColor("#004D40")
                .secondaryColor("#EC5B13")
                .buttonColor("#004D40")
                .sidebarColor("#004D40")
                .badgeColor("#EC5B13")
                .fontPrimary(scope.equals("backoffice") ? "Public Sans" : "Poppins")
                .fontSecondary("Poppins")
                .fontSidebar("Public Sans")
                .fontButton("Public Sans")
                .fontBadge("Public Sans")
                .sidebarStyle("Étendu")
                .showIcons(true)
                .showLogo(true)
                .logoScale(100)
                .logoAlign("left")
                .borderRadius(12)
                .darkMode(false)
                .animations(true)
                .build();
        return repository.save(settings);
    }

    private AppearanceResponse mapToResponse(AppearanceSettings e) {
        return AppearanceResponse.builder()
                .id(e.getId())
                .scope(e.getScope())
                .primaryColor(e.getPrimaryColor())
                .secondaryColor(e.getSecondaryColor())
                .buttonColor(e.getButtonColor())
                .buttonHoverColor(e.getButtonHoverColor())
                .buttonTextColor(e.getButtonTextColor())
                .sidebarColor(e.getSidebarColor())
                .badgeColor(e.getBadgeColor())
                .fontPrimary(e.getFontPrimary())
                .fontSecondary(e.getFontSecondary())
                .fontSidebar(e.getFontSidebar())
                .fontButton(e.getFontButton())
                .fontBadge(e.getFontBadge())
                .logoMain(e.getLogoMain())
                .logoLight(e.getLogoLight())
                .logoNavbar(e.getLogoNavbar())
                .favicon(e.getFavicon())
                .loader(e.getLoader())
                .sidebarStyle(e.getSidebarStyle())
                .showIcons(e.isShowIcons())
                .showLogo(e.isShowLogo())
                .logoScale(e.getLogoScale() != null ? e.getLogoScale() : 100)
                .logoAlign(e.getLogoAlign() != null ? e.getLogoAlign() : "left")
                .borderRadius(e.getBorderRadius())
                .darkMode(e.isDarkMode())
                .animations(e.isAnimations())
                .brandName(e.getBrandName())
                .domain(e.getDomain())
                .phone(e.getPhone())
                .email(e.getEmail())
                .slogan(e.getSlogan())
                .instagram(e.getInstagram())
                .facebook(e.getFacebook())
                .linkedin(e.getLinkedin())
                .whatsapp(e.getWhatsapp())
                .createdAt(e.getCreatedAt())
                .updatedAt(e.getUpdatedAt())
                .build();
    }
}
