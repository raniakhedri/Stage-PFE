package com.ecommerce.controller;

import com.ecommerce.dto.request.ReturnPolicyRequest;
import com.ecommerce.dto.response.ReturnPolicyResponse;
import com.ecommerce.dto.response.ReturnResponse;
import com.ecommerce.service.ReturnPolicyService;
import com.ecommerce.service.ReturnService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/returns")
@RequiredArgsConstructor
public class AdminReturnController {

    private final ReturnService returnService;
    private final ReturnPolicyService returnPolicyService;

    @GetMapping
    public ResponseEntity<List<ReturnResponse>> getAll() {
        return ResponseEntity.ok(returnService.getAllReturns());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReturnResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(returnService.getReturnById(id));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ReturnResponse> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(returnService.updateStatus(id, body.get("status"), body.get("motifRefus")));
    }

    @GetMapping("/policy")
    public ResponseEntity<ReturnPolicyResponse> getPolicy() {
        return ResponseEntity.ok(returnPolicyService.getPolicy());
    }

    @PutMapping("/policy")
    public ResponseEntity<ReturnPolicyResponse> savePolicy(@RequestBody ReturnPolicyRequest request) {
        return ResponseEntity.ok(returnPolicyService.savePolicy(request));
    }
}
