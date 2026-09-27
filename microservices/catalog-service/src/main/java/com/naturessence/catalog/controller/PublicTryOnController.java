package com.naturessence.catalog.controller;

import com.naturessence.catalog.service.DecartTryOnService;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/public/tryon")
@RequiredArgsConstructor
public class PublicTryOnController {

    private final DecartTryOnService decartTryOnService;

    @PostMapping("/token")
    public ResponseEntity<Map<String, Object>> createToken() {
        return ResponseEntity.ok(decartTryOnService.createClientToken());
    }
}
