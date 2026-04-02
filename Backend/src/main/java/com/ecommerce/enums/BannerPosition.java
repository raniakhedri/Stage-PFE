package com.ecommerce.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum BannerPosition {
    HOMEPAGE_HERO("Homepage Hero"),
    SECTION_PROMO("Section Promo"),
    PAGE_CATEGORIE("Page Catégorie"),
    POPUP("Popup"),
    FOOTER("Footer");

    private final String label;
}
