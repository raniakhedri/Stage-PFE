package com.naturessence.marketing.controller;

import com.naturessence.marketing.service.StoreProfileService;
import com.naturessence.shared.dto.response.StoreProfileResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/public/store")
@RequiredArgsConstructor
public class PublicStoreController {

    private final StoreProfileService storeProfileService;

    @GetMapping
    public ResponseEntity<StoreProfileResponse> get() {
        return ResponseEntity.ok(storeProfileService.get());
    }
}
