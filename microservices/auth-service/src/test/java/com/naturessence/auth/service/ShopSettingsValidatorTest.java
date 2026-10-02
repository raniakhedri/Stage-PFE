package com.naturessence.auth.service;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ShopSettingsValidatorTest {

    @Test
    void keepsAValidCustomization() {
        String json = "{\"logo\":{\"height\":48},\"identity\":{\"instagram\":\"https://instagram.com/shop\"},"
                + "\"home\":{\"sections\":[{\"id\":\"hero\",\"enabled\":true}],\"texts\":{\"heroTitle\":\"<b>Bonjour</b>\"}}}";
        String cleaned = ShopSettingsValidator.clean(json);
        assertThat(cleaned).contains("\"height\":48").contains("https://instagram.com/shop").contains("<b>Bonjour</b>");
    }

    @Test
    void emptyMeansNoCustomization() {
        assertThat(ShopSettingsValidator.clean("  {}  ")).isNull();
        assertThat(ShopSettingsValidator.clean("")).isNull();
        assertThat(ShopSettingsValidator.clean(null)).isNull();
    }

    @Test
    void refusesScriptLinksEvenNested() {
        assertThatThrownBy(() -> ShopSettingsValidator.clean("{\"identity\":{\"facebook\":\"javascript:alert(1)\"}}"))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("facebook");
        assertThatThrownBy(() -> ShopSettingsValidator.clean("{\"a\":[{\"tiktok\":\"data:text/html,x\"}]}"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void refusesAnythingButAnObject() {
        assertThatThrownBy(() -> ShopSettingsValidator.clean("[1,2]")).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> ShopSettingsValidator.clean("{not json")).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> ShopSettingsValidator.clean("\"text\"")).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void refusesOversizedSettings() {
        String big = "{\"t\":\"" + "x".repeat(ShopSettingsValidator.MAX_LENGTH) + "\"}";
        assertThatThrownBy(() -> ShopSettingsValidator.clean(big)).hasMessageContaining("volumineuse");
    }
}
