package com.naturessence.auth.controller;

import com.naturessence.shared.dto.response.ShopPublicResponse;
import com.naturessence.shared.entity.Shop;
import com.naturessence.shared.repository.ShopRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/public/shops")
@RequiredArgsConstructor
public class PublicShopController {

    private final ShopRepository shopRepository;

    @GetMapping("/{slug}")
    public ShopPublicResponse getBySlug(@PathVariable String slug) {
        return shopRepository.findBySlug(slug)
                .map(PublicShopController::toResponse)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Boutique introuvable"));
    }

    public static ShopPublicResponse toResponse(Shop shop) {
        return ShopPublicResponse.builder()
                .name(shop.getName())
                .slug(shop.getSlug())
                .businessType(shop.getBusinessType())
                .templateKey(shop.getTemplateKey())
                .logo(shop.getLogo())
                .primaryColor(shop.getPrimaryColor())
                .buttonColor(shop.getButtonColor())
                .buttonTextColor(shop.getButtonTextColor())
                .accentColor(shop.getAccentColor())
                .backgroundColor(shop.getBackgroundColor())
                .textColor(shop.getTextColor())
                .customOptions(shop.getCustomOptions())
                .theme(shop.getTheme())
                .status(Shop.statusOf(shop))
                .build();
    }
}
