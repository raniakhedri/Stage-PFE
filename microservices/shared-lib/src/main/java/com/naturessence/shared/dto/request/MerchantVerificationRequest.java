package com.naturessence.shared.dto.request;

import lombok.Data;

/**
 * Identity documents and card reference sent by a merchant before the platform opens their shop.
 * Card numbers never reach the server: the card is collected and checked by Stripe, and only
 * the resulting payment method id plus display details (brand, last 4 digits, expiry) are stored.
 */
@Data
public class MerchantVerificationRequest {
    /** CIN or PASSPORT */
    private String documentType;
    private String documentNumber;
    /** Images as data URLs. */
    private String documentFront;
    private String documentBack;
    private String selfie;

    private String cardholderName;
    private String cardBrand;
    private String cardLast4;
    private Integer cardExpMonth;
    private Integer cardExpYear;
    private String stripePaymentMethodId;
    private String stripeSetupIntentId;
}
