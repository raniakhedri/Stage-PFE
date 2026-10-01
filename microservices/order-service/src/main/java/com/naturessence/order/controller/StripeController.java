package com.naturessence.order.controller;

import com.naturessence.order.service.CheckoutPricingService;
import com.naturessence.order.service.StripeService;
import com.naturessence.shared.dto.request.OrderRequest;
import com.naturessence.shared.repository.UserRepository;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/public/stripe")
@RequiredArgsConstructor
public class StripeController {

    private final StripeService stripeService;
    private final CheckoutPricingService pricingService;
    private final UserRepository userRepository;

    /**
     * Card payment for a cart. The body is the same as the order (items, zone, coupon, shop): the amount is
     * computed here from the catalogue, never sent by the browser.
     */
    @PostMapping("/payment-intent")
    public ResponseEntity<?> createPaymentIntent(@Valid @RequestBody OrderRequest request, Authentication authentication) {
        Long userId = null;
        if (authentication != null && authentication.getName() != null && !"anonymousUser".equals(authentication.getName())) {
            userId = userRepository.findByEmailIgnoreCase(authentication.getName()).map(u -> u.getId()).orElse(null);
        }
        CheckoutPricingService.Quote quote = pricingService.quote(request, userId);
        try {
            PaymentIntent intent = stripeService.createPaymentIntent(quote.amountInCents(), request.getShopSlug());
            return ResponseEntity.ok(Map.of(
                    "clientSecret", intent.getClientSecret(),
                    "paymentIntentId", intent.getId(),
                    "total", quote.total(),
                    "subtotal", quote.subtotal(),
                    "couponDiscount", quote.couponDiscount(),
                    "shippingCost", quote.shippingCost()));
        } catch (StripeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage(), "message", e.getMessage()));
        }
    }

    /** Card check for merchant sign-up: the card is saved by Stripe, no charge is made. */
    @PostMapping("/setup-intent")
    public ResponseEntity<?> createSetupIntent() {
        try {
            return ResponseEntity.ok(Map.of("clientSecret", stripeService.createSetupIntent()));
        } catch (StripeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
