package com.ecommerce.service;

import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.param.PaymentIntentCreateParams;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class StripeService {

    @Value("${stripe.secret-key}")
    private String secretKey;

    @PostConstruct
    public void init() {
        Stripe.apiKey = secretKey;
    }

    /**
     * Creates a PaymentIntent for the given amount (in TND, converted to millimes for Stripe).
     * Stripe uses the smallest currency unit — for TND (Tunisian Dinar), 1 TND = 1000 millimes.
     * However, Stripe does not support TND natively. We charge in EUR as a proxy here.
     * Adjust currency and conversion if your Stripe account supports TND.
     *
     * @param amountTnd the total amount in TND
     * @param orderId   a reference to tag the PaymentIntent with metadata
     * @return Stripe client secret to be sent to frontend
     */
    public String createPaymentIntent(double amountTnd, String orderId) throws StripeException {
        // Stripe does not support TND — using EUR for demo. 1 TND ≈ 0.30 EUR
        // In production, verify with your payment processor for TND support.
        long amountInCents = Math.round(amountTnd * 100); // EUR cents

        PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                .setAmount(amountInCents)
                .setCurrency("eur")
                .putMetadata("order_reference", orderId)
                .setAutomaticPaymentMethods(
                        PaymentIntentCreateParams.AutomaticPaymentMethods.builder()
                                .setEnabled(true)
                                .build()
                )
                .build();

        PaymentIntent intent = PaymentIntent.create(params);
        return intent.getClientSecret();
    }
}
