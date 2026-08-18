package com.naturessence.order.controller;

import com.naturessence.order.service.OrderService;
import com.naturessence.order.service.ReturnService;
import com.naturessence.shared.dto.request.ReturnRequestDTO;
import com.naturessence.shared.dto.response.OrderResponse;
import com.naturessence.shared.dto.response.ReturnResponse;
import com.naturessence.shared.entity.User;
import com.naturessence.shared.repository.UserRepository;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/profile")
@RequiredArgsConstructor
public class ProfileOrderController {

    private final OrderService orderService;
    private final ReturnService returnService;
    private final UserRepository userRepository;

    @GetMapping("/orders")
    public ResponseEntity<List<OrderResponse>> getMyOrders(Authentication authentication) {
        return ResponseEntity.ok(
            orderService.getOrdersForAuthenticatedUser(authentication.getName())
        );
    }

    @GetMapping("/returns")
    public ResponseEntity<List<ReturnResponse>> getMyReturns(Authentication authentication) {
        Long userId = userRepository
            .findByEmailIgnoreCase(authentication.getName())
            .map(User::getId)
            .orElseThrow(() ->
                new IllegalArgumentException("Utilisateur introuvable")
            );
        return ResponseEntity.ok(returnService.getMyReturns(userId));
    }

    @PostMapping("/returns")
    public ResponseEntity<ReturnResponse> submitReturn(
        Authentication authentication,
        @Valid @RequestBody ReturnRequestDTO request
    ) {
        return ResponseEntity.ok(
            returnService.createReturn(authentication.getName(), request)
        );
    }
}
