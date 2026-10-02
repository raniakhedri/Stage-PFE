package com.naturessence.marketing.service;

import com.naturessence.shared.dto.request.StoreProfileRequest;
import com.naturessence.shared.dto.response.StoreProfileResponse;
import com.naturessence.shared.entity.StoreProfile;
import com.naturessence.shared.repository.StoreProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.naturessence.shared.catalog.ShopCatalog;

@Service
@RequiredArgsConstructor
public class StoreProfileService {


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

        if (request.getTemplateKey() != null) {
            profile.setTemplateKey(ShopCatalog.layout(request.getTemplateKey()));
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
        return ShopCatalog.businessType(raw);
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
