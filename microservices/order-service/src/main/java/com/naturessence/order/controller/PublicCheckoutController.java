package com.naturessence.order.controller;

import com.naturessence.shared.security.CurrentUser;
import com.naturessence.order.service.OrderService;
import com.naturessence.order.service.TvaShippingService;
import com.naturessence.shared.dto.request.OrderRequest;
import com.naturessence.shared.dto.response.OrderResponse;
import com.naturessence.shared.dto.response.ShippingZoneResponse;
import com.naturessence.shared.dto.response.TvaConfigResponse;
import com.naturessence.shared.entity.User;
import com.naturessence.shared.repository.UserRepository;
import org.springframework.security.core.Authentication;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/public/checkout")
@RequiredArgsConstructor
public class PublicCheckoutController {

    private final TvaShippingService tvaShippingService;
    private final OrderService orderService;
    private final UserRepository userRepository;

    @GetMapping("/shipping-zones")
    public ResponseEntity<List<ShippingZoneResponse>> getOpenShippingZones(
            @RequestParam(required = false) String shop) {
        List<ShippingZoneResponse> all = tvaShippingService.getAllZones(shop);
        List<ShippingZoneResponse> open = all.stream()
                .filter(z -> "Ouverte".equals(z.getStatut()))
                .toList();
        return ResponseEntity.ok(open);
    }

    @GetMapping("/tva-config")
    public ResponseEntity<TvaConfigResponse> getTvaConfig(@RequestParam(required = false) String shop) {
        return ResponseEntity.ok(tvaShippingService.getConfig(shop));
    }

    @PostMapping("/orders")
    public ResponseEntity<OrderResponse> placeOrder(@Valid @RequestBody OrderRequest request,
                                                    Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(orderService.createOrder(request, signedInUser(authentication)));
    }

    /** The customer is taken from the JWT, never from the request body (userId is ignored). */
    private User signedInUser(Authentication authentication) {
        Long userId = CurrentUser.id(authentication);
        return userId == null ? null : userRepository.findById(userId).orElse(null);
    }
}
