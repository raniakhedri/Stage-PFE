package com.naturessence.auth.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.Set;

/**
 * Checks a shop's customization JSON (logo size, identity, announcement, homepage, backoffice colours) before it
 * is stored. Text is rendered as text by the storefront; links must be http(s) so they cannot run script.
 */
public final class ShopSettingsValidator {

    static final int MAX_LENGTH = 100_000;

    /** Keys whose value is put in a link. */
    private static final Set<String> LINK_KEYS = Set.of("instagram", "facebook", "tiktok", "youtube", "linkedin", "website");
    private static final ObjectMapper JSON = new ObjectMapper();

    private ShopSettingsValidator() {
    }

    /** Normalised JSON, or null for an empty value. */
    public static String clean(String value) {
        if (value == null) return null;
        String raw = value.trim();
        if (raw.isEmpty() || "{}".equals(raw)) return null;
        if (raw.length() > MAX_LENGTH) throw new IllegalArgumentException("Personnalisation trop volumineuse.");
        JsonNode root;
        try {
            root = JSON.readTree(raw);
        } catch (Exception e) {
            throw new IllegalArgumentException("Personnalisation invalide.");
        }
        if (root == null || !root.isObject()) throw new IllegalArgumentException("Personnalisation invalide.");
        checkLinks(root);
        return root.toString();
    }

    private static void checkLinks(JsonNode node) {
        node.fields().forEachRemaining(entry -> {
            JsonNode child = entry.getValue();
            if (child.isTextual() && LINK_KEYS.contains(entry.getKey())) {
                String link = child.asText().trim();
                if (!link.isEmpty() && !link.matches("(?i)https?://\\S+")) {
                    throw new IllegalArgumentException("Le lien « " + entry.getKey() + " » doit commencer par https://");
                }
            }
            if (child.isObject()) checkLinks(child);
            if (child.isArray()) child.forEach(item -> { if (item.isObject()) checkLinks(item); });
        });
    }
}
