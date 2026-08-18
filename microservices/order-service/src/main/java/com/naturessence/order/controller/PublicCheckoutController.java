package com.naturessence.order.controller;

import com.naturessence.order.service.OrderService;
import com.naturessence.order.service.TvaShippingService;
import com.naturessence.shared.dto.request.OrderRequest;
import com.naturessence.shared.dto.response.OrderResponse;
import com.naturessence.shared.dto.response.ShippingZoneResponse;
import com.naturessence.shared.dto.response.TvaConfigResponse;
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

    @GetMapping("/shipping-zones")
    public ResponseEntity<List<ShippingZoneResponse>> getOpenShippingZones() {
        List<ShippingZoneResponse> all = tvaShippingService.getAllZones();
        List<ShippingZoneResponse> open = all.stream()
                .filter(z -> "Ouverte".equals(z.getStatut()))
                .toList();
        return ResponseEntity.ok(open);
    }

    @GetMapping("/tva-config")
    public ResponseEntity<TvaConfigResponse> getTvaConfig() {
        return ResponseEntity.ok(tvaShippingService.getConfig());
    }

    @PostMapping("/orders")
    public ResponseEntity<OrderResponse> placeOrder(@Valid @RequestBody OrderRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(orderService.createOrder(request));
    }
}
