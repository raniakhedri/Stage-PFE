package com.naturessence.marketing.controller;

import com.naturessence.marketing.service.StoreProfileService;
import com.naturessence.shared.dto.request.StoreProfileRequest;
import com.naturessence.shared.dto.response.StoreProfileResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/store")
@RequiredArgsConstructor
public class AdminStoreController {

    private final StoreProfileService storeProfileService;

    @GetMapping
    public ResponseEntity<StoreProfileResponse> get() {
        return ResponseEntity.ok(storeProfileService.get());
    }

    @PutMapping
    public ResponseEntity<StoreProfileResponse> save(@RequestBody StoreProfileRequest request) {
        return ResponseEntity.ok(storeProfileService.save(request));
    }
}
