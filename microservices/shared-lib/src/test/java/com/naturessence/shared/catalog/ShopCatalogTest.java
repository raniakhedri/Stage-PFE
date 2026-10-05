package com.naturessence.shared.catalog;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ShopCatalogTest {

    @Test
    void acceptsEverySectorWhateverTheCase() {
        ShopCatalog.BUSINESS_TYPES.forEach(type ->
                assertThat(ShopCatalog.businessType(" " + type.toLowerCase() + " ")).isEqualTo(type));
    }

    @Test
    void refusesUnknownSector() {
        assertThatThrownBy(() -> ShopCatalog.businessType("SPACESHIPS"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Secteur d'activité inconnu");
        assertThatThrownBy(() -> ShopCatalog.businessType(null)).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void fashionLikeSectorsAreKnownSectors() {
        assertThat(ShopCatalog.BUSINESS_TYPES).containsAll(ShopCatalog.FASHION_LIKE);
        assertThat(ShopCatalog.FASHION_LIKE).containsExactlyInAnyOrder("CLOTHES", "SPORTS", "KIDS");
    }

    @Test
    void keepsTheEightLayoutsAndMapsLegacyThemes() {
        ShopCatalog.LAYOUTS.forEach(layout -> assertThat(ShopCatalog.layout(layout.toUpperCase())).isEqualTo(layout));
        assertThat(ShopCatalog.layout("noir")).isEqualTo("bold");
        assertThat(ShopCatalog.layout("botanique")).isEqualTo("luxury");
        assertThat(ShopCatalog.layout("unknown")).isEqualTo("minimal");
        assertThat(ShopCatalog.layout(null)).isEqualTo("minimal");
    }
}
