package com.naturessence.shared.catalog;

import java.util.List;
import java.util.Set;

/**
 * Sectors a Sellio shop can sell in, and the storefront templates it can use.
 * Same lists as the front-ends (backoffice {@code data/sectors.js} / {@code data/storeTemplates.js}).
 */
public final class ShopCatalog {

    private ShopCatalog() {
    }

    public static final List<String> BUSINESS_TYPES = List.of(
            "CLOTHES", "COSMETICS", "SPORTS", "ELECTRONICS", "HOME", "FOOD", "JEWELRY", "KIDS");

    /**
     * Sectors whose customers buy like fashion customers (sizes, seasons, frequent small baskets):
     * their churn is scored with the model trained on H&amp;M, which covers women, men, kids and sport lines.
     */
    public static final Set<String> FASHION_LIKE = Set.of("CLOTHES", "SPORTS", "KIDS");

    public static final List<String> LAYOUTS = List.of(
            "minimal", "bold", "luxury", "sport", "tech", "artisan", "pop", "editorial");

    /** Validated sector code; unknown values are refused. */
    public static String businessType(String raw) {
        String value = raw == null ? "" : raw.trim().toUpperCase();
        if (!BUSINESS_TYPES.contains(value)) {
            throw new IllegalArgumentException("Secteur d'activité inconnu : " + raw);
        }
        return value;
    }

    /** Template key; legacy keys of the first NaturEssence themes map to their closest layout. */
    public static String layout(String raw) {
        String key = raw == null ? "" : raw.trim().toLowerCase();
        if (LAYOUTS.contains(key)) return key;
        if ("noir".equals(key) || "marin".equals(key)) return "bold";
        if ("atelier".equals(key) || "apothicaire".equals(key) || "botanique".equals(key)) return "luxury";
        return "minimal";
    }
}
