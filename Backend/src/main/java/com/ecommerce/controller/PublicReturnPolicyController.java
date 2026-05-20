package com.ecommerce.controller;

import com.ecommerce.dto.response.ReturnPolicyResponse;
import com.ecommerce.service.ReturnPolicyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/public/return-policy")
@RequiredArgsConstructor
public class PublicReturnPolicyController {

    private final ReturnPolicyService returnPolicyService;

    @GetMapping
    public ResponseEntity<ReturnPolicyResponse> getPolicy() {
        return ResponseEntity.ok(returnPolicyService.getPolicy());
    }
}
