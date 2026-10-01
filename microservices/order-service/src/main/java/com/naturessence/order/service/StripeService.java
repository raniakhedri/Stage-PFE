package com.naturessence.order.service;

import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.model.Refund;
import com.stripe.model.SetupIntent;
import com.stripe.param.PaymentIntentCreateParams;
import com.stripe.param.RefundCreateParams;
import com.stripe.param.SetupIntentCreateParams;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class StripeService {

    /** Stripe does not support the Tunisian dinar: test payments are made in euros (1 TND charged as 1 EUR). */
    public static final String CURRENCY = "eur";

    @Value("${stripe.secret-key}")
    private String secretKey;

    @PostConstruct
    public void init() {
        Stripe.apiKey = secretKey;
    }

    /** Creates a PaymentIntent for an amount computed by the server (see CheckoutPricingService). */
    public PaymentIntent createPaymentIntent(long amountInCents, String shopSlug) throws StripeException {
        PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                .setAmount(amountInCents)
                .setCurrency(CURRENCY)
                .putMetadata("shop", shopSlug == null ? "" : shopSlug)
                .setAutomaticPaymentMethods(
                        PaymentIntentCreateParams.AutomaticPaymentMethods.builder()
                                .setEnabled(true)
                                .build()
                )
                .build();
        return PaymentIntent.create(params);
    }

    /**
     * Checks with Stripe (never with the browser) that the payment went through for exactly the expected amount.
     */
    public void requireSucceeded(String paymentIntentId, long expectedAmountInCents) {
        if (paymentIntentId == null || !paymentIntentId.startsWith("pi_")) {
            throw new IllegalArgumentException("Paiement par carte introuvable. Veuillez réessayer.");
        }
        PaymentIntent intent;
        try {
            intent = PaymentIntent.retrieve(paymentIntentId);
        } catch (StripeException e) {
            throw new IllegalArgumentException("Impossible de vérifier le paiement auprès de Stripe.");
        }
        if (!"succeeded".equals(intent.getStatus())) {
            throw new IllegalArgumentException("Le paiement n'a pas abouti (statut : " + intent.getStatus() + ").");
        }
        if (intent.getAmount() == null || intent.getAmount() != expectedAmountInCents
                || !CURRENCY.equalsIgnoreCase(intent.getCurrency())) {
            refundQuietly(paymentIntentId);
            throw new IllegalArgumentException(
                    "Le montant payé ne correspond plus au panier (prix ou stock modifié). Vous avez été remboursé ; merci de recommencer.");
        }
    }

    /** Full refund, used when a paid order cannot be saved (e.g. the last item was just sold). */
    public void refundQuietly(String paymentIntentId) {
        try {
            Refund.create(RefundCreateParams.builder().setPaymentIntent(paymentIntentId).build());
            log.warn("[Stripe] Paiement {} remboursé", paymentIntentId);
        } catch (StripeException e) {
            log.error("[Stripe] Remboursement impossible pour {} : {}", paymentIntentId, e.getMessage());
        }
    }

    /** SetupIntent used to verify and save a merchant's card without charging it. */
    public String createSetupIntent() throws StripeException {
        SetupIntentCreateParams params = SetupIntentCreateParams.builder()
                .addPaymentMethodType("card")
                .setUsage(SetupIntentCreateParams.Usage.OFF_SESSION)
                .putMetadata("purpose", "sellio_merchant_verification")
                .build();
        return SetupIntent.create(params).getClientSecret();
    }
}
