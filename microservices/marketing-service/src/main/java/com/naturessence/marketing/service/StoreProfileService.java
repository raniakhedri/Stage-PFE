package com.naturessence.marketing.service;

import com.naturessence.shared.dto.request.StoreProfileRequest;
import com.naturessence.shared.dto.response.StoreProfileResponse;
import com.naturessence.shared.entity.StoreProfile;
import com.naturessence.shared.repository.StoreProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class StoreProfileService {

    private static final Map<String, Set<String>> TEMPLATES = Map.of(
            "COSMETICS", Set.of("botanique", "nude"),
            "CLOTHES", Set.of("atelier", "noir")
    );

    private final StoreProfileRepository repository;

    @Transactional
    public StoreProfileResponse get() {
        return toResponse(loadOrCreate());
    }

    @Transactional
    public StoreProfileResponse save(StoreProfileRequest request) {
        StoreProfile profile = loadOrCreate();
        String business = normalizeBusiness(request.getBusinessType());
        if (business != null) profile.setBusinessType(business);

        String template = request.getTemplateKey() == null ? null : request.getTemplateKey().trim().toLowerCase();
        Set<String> allowed = TEMPLATES.get(profile.getBusinessType());
        String fallback = "CLOTHES".equals(profile.getBusinessType()) ? "atelier" : "botanique";
        if (template != null && allowed.contains(template)) {
            profile.setTemplateKey(template);
        } else if (template != null || !allowed.contains(profile.getTemplateKey())) {
            profile.setTemplateKey(fallback);
        }

        if (request.getStoreName() != null) {
            String name = request.getStoreName().trim();
            profile.setStoreName(name.isEmpty() ? null : name);
        }
        if (Boolean.TRUE.equals(request.getOnboarded())) {
            profile.setOnboarded(true);
        }
        return toResponse(repository.save(profile));
    }

    private StoreProfile loadOrCreate() {
        return repository.findAll().stream().findFirst().orElseGet(() ->
                repository.save(StoreProfile.builder().build()));
    }

    private String normalizeBusiness(String raw) {
        if (raw == null || raw.isBlank()) return null;
        String value = raw.trim().toUpperCase();
        if (!TEMPLATES.containsKey(value)) {
            throw new IllegalArgumentException("Type d'activité inconnu: " + raw);
        }
        return value;
    }

    private StoreProfileResponse toResponse(StoreProfile profile) {
        return StoreProfileResponse.builder()
                .businessType(profile.getBusinessType())
                .templateKey(profile.getTemplateKey())
                .onboarded(profile.isOnboarded())
                .storeName(profile.getStoreName())
                .build();
    }
}
