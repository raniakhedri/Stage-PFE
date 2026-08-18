package com.naturessence.order.controller;

import com.naturessence.order.service.ReturnPolicyService;
import com.naturessence.shared.dto.response.ReturnPolicyResponse;
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
