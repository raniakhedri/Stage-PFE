package com.ecommerce.service;

import com.ecommerce.entity.Order;
import com.ecommerce.entity.OrderItem;
import com.ecommerce.entity.User;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Locale;
import java.util.Map;
import java.util.List;

@Slf4j
@Service
public class EmailService {

    private static final String BREVO_URL = "https://api.brevo.com/v3/smtp/email";

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${brevo.api-key}")
    private String apiKey;

    @Value("${brevo.sender-email:rannniakhedri@gmail.com}")
    private String senderEmail;

    @Value("${brevo.sender-name:NaturEssence}")
    private String senderName;

    @Value("${brevo.reply-to:rannniakhedri@gmail.com}")
    private String replyTo;

    @Async
    public void sendOrderConfirmation(Order order) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("api-key", apiKey);

            // Use a HashMap to support replyTo (Map.of is fine for ≤10 keys)
            java.util.HashMap<String, Object> body = new java.util.HashMap<>();
            body.put("sender",      Map.of("name", senderName, "email", senderEmail));
            body.put("to",          List.of(Map.of("email", order.getEmail(),
                                                   "name",  order.getFirstName() + " " + order.getLastName())));
            body.put("replyTo",     Map.of("email", replyTo));
            body.put("subject",     "Confirmation de commande — " + order.getReference());
            body.put("htmlContent", buildInvoiceHtml(order));

            log.info("[Brevo] Sending email to {} from {} via Brevo...", order.getEmail(), senderEmail);
            HttpEntity<java.util.HashMap<String, Object>> request = new HttpEntity<>(body, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(BREVO_URL, request, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("[Brevo] Email sent successfully to {} for order {}", order.getEmail(), order.getReference());
            } else {
                log.warn("[Brevo] Non-2xx response {}: {}", response.getStatusCode(), response.getBody());
            }
        } catch (org.springframework.web.client.HttpClientErrorException e) {
            log.error("[Brevo] HTTP {} error: {}", e.getStatusCode(), e.getResponseBodyAsString());
        } catch (Exception e) {
            log.error("[Brevo] Failed to send email for order {}: {} — {}", order.getReference(), e.getClass().getSimpleName(), e.getMessage());
        }
    }

    private String buildInvoiceHtml(Order order) {
        String date = order.getCreatedAt() != null
                ? order.getCreatedAt().format(DateTimeFormatter.ofPattern("dd MMMM yyyy 'à' HH:mm", Locale.FRENCH))
                : "—";

        double subtotal      = order.getSubtotal()        != null ? order.getSubtotal()        : 0.0;
        double shippingCost  = order.getShippingCost()    != null ? order.getShippingCost()     : 0.0;
        double discount      = order.getCouponDiscount()  != null ? order.getCouponDiscount()   : 0.0;
        double total         = order.getTotal()           != null ? order.getTotal()            : 0.0;
        double tvaRate       = order.getTvaRate()         != null ? order.getTvaRate()          : 0.0;
        double tvaAmount     = order.getTvaAmount()       != null ? order.getTvaAmount()        : 0.0;

        // Build item rows
        StringBuilder rows = new StringBuilder();
        for (OrderItem item : order.getItems()) {
            rows.append("""
                    <tr>
                      <td style="padding:10px 12px;border-bottom:1px solid #f0ebe3;">
                        <div style="font-weight:600;color:#2d4a3e;">%s</div>
                        %s
                      </td>
                      <td style="padding:10px 12px;border-bottom:1px solid #f0ebe3;text-align:center;color:#5a7a6a;">%d</td>
                      <td style="padding:10px 12px;border-bottom:1px solid #f0ebe3;text-align:right;color:#5a7a6a;">%.2f TND</td>
                      <td style="padding:10px 12px;border-bottom:1px solid #f0ebe3;text-align:right;font-weight:600;color:#2d4a3e;">%.2f TND</td>
                    </tr>
                    """.formatted(
                    item.getProductName(),
                    item.getSize() != null && !item.getSize().isBlank()
                            ? "<div style='color:#5a7a6a;font-size:12px;'>" + item.getSize() + "</div>" : "",
                    item.getQuantity(),
                    item.getUnitPrice(),
                    item.getLineTotal()
            ));
        }

        String paymentLabel = (order.getPaymentMethod() != null && "CARTE".equals(order.getPaymentMethod().name()))
                ? "Carte bancaire (Stripe)" : "Paiement à la livraison";

        String shippingLine = shippingCost == 0
                ? "<span style='color:#22c55e;font-weight:600;'>Gratuite</span>"
                : String.format("%.2f TND", shippingCost);

        String couponRow = (discount > 0 && order.getCouponCode() != null) ? """
                <tr>
                  <td colspan="2" style="padding:6px 0;color:#5a7a6a;">Réduction (%s)</td>
                  <td style="padding:6px 0;text-align:right;color:#22c55e;font-weight:600;">−%.2f TND</td>
                </tr>
                """.formatted(order.getCouponCode(), discount) : "";

        String tvaRow = (tvaRate > 0 && tvaAmount > 0) ? """
                <tr>
                  <td colspan="2" style="padding:6px 0;color:#5a7a6a;font-size:12px;">dont TVA (%.0f%%)</td>
                  <td style="padding:6px 0;text-align:right;color:#5a7a6a;font-size:12px;">%.2f TND</td>
                </tr>
                """.formatted(tvaRate, tvaAmount) : "";

        return """
                <!DOCTYPE html>
                <html lang="fr">
                <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
                <title>Confirmation de commande</title></head>
                <body style="margin:0;padding:0;background:#f7f4ef;font-family:'Helvetica Neue',Arial,sans-serif;">
                <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f7f4ef;padding:40px 0;">
                  <tr><td align="center">
                    <table width="620" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

                      <!-- Header -->
                      <tr>
                        <td style="background:linear-gradient(135deg,#2d4a3e 0%%,#4a7c65 100%%);padding:36px 40px;text-align:center;">
                          <h1 style="margin:0;color:#f0c866;font-size:28px;letter-spacing:2px;font-weight:300;">NATURESSENCE</h1>
                          <p style="margin:8px 0 0;color:#c8ddd4;font-size:13px;letter-spacing:1px;">L'Éveil des Sens Naturels</p>
                        </td>
                      </tr>

                      <!-- Confirmation -->
                      <tr>
                        <td style="padding:36px 40px 24px;text-align:center;border-bottom:1px solid #f0ebe3;">
                          <div style="width:56px;height:56px;background:#e8f5e9;border-radius:50%%;margin:0 auto 16px;line-height:56px;font-size:28px;">✓</div>
                          <h2 style="margin:0 0 8px;color:#2d4a3e;font-size:20px;">Commande confirmée !</h2>
                          <p style="margin:0;color:#5a7a6a;font-size:14px;">Merci %s, votre commande a bien été reçue.</p>
                          <p style="margin:12px 0 0;font-size:12px;color:#8aab9a;">%s</p>
                        </td>
                      </tr>

                      <!-- Order meta -->
                      <tr>
                        <td style="padding:24px 40px;background:#faf8f5;">
                          <table width="100%%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="width:50%%;padding-right:16px;">
                                <p style="margin:0 0 4px;font-size:11px;color:#8aab9a;text-transform:uppercase;letter-spacing:1px;">Référence</p>
                                <p style="margin:0;font-size:14px;font-weight:700;color:#2d4a3e;">%s</p>
                              </td>
                              <td>
                                <p style="margin:0 0 4px;font-size:11px;color:#8aab9a;text-transform:uppercase;letter-spacing:1px;">Paiement</p>
                                <p style="margin:0;font-size:14px;color:#2d4a3e;">%s</p>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding-top:16px;padding-right:16px;">
                                <p style="margin:0 0 4px;font-size:11px;color:#8aab9a;text-transform:uppercase;letter-spacing:1px;">Zone livraison</p>
                                <p style="margin:0;font-size:14px;color:#2d4a3e;">%s</p>
                              </td>
                              <td style="padding-top:16px;">
                                <p style="margin:0 0 4px;font-size:11px;color:#8aab9a;text-transform:uppercase;letter-spacing:1px;">Adresse</p>
                                <p style="margin:0;font-size:14px;color:#2d4a3e;">%s, %s %s</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                      <!-- Items -->
                      <tr>
                        <td style="padding:24px 40px 0;">
                          <h3 style="margin:0 0 16px;color:#2d4a3e;font-size:15px;font-weight:700;border-bottom:2px solid #f0c866;padding-bottom:8px;">Détail de la commande</h3>
                          <table width="100%%" cellpadding="0" cellspacing="0">
                            <thead>
                              <tr style="background:#faf8f5;">
                                <th style="padding:10px 12px;text-align:left;font-size:11px;color:#8aab9a;text-transform:uppercase;letter-spacing:1px;">Produit</th>
                                <th style="padding:10px 12px;text-align:center;font-size:11px;color:#8aab9a;text-transform:uppercase;letter-spacing:1px;">Qté</th>
                                <th style="padding:10px 12px;text-align:right;font-size:11px;color:#8aab9a;text-transform:uppercase;letter-spacing:1px;">Prix unit.</th>
                                <th style="padding:10px 12px;text-align:right;font-size:11px;color:#8aab9a;text-transform:uppercase;letter-spacing:1px;">Total</th>
                              </tr>
                            </thead>
                            <tbody>%s</tbody>
                          </table>
                        </td>
                      </tr>

                      <!-- Totals -->
                      <tr>
                        <td style="padding:16px 40px 32px;">
                          <table width="100%%" cellpadding="0" cellspacing="0" style="margin-left:auto;max-width:280px;">
                            <tr>
                              <td colspan="2" style="padding:6px 0;color:#5a7a6a;">Sous-total</td>
                              <td style="padding:6px 0;text-align:right;font-weight:600;color:#2d4a3e;">%.2f TND</td>
                            </tr>
                            <tr>
                              <td colspan="2" style="padding:6px 0;color:#5a7a6a;">Livraison</td>
                              <td style="padding:6px 0;text-align:right;">%s</td>
                            </tr>
                            %s%s
                            <tr>
                              <td colspan="2" style="padding:12px 0 4px;border-top:2px solid #2d4a3e;font-weight:700;color:#2d4a3e;font-size:15px;">Total TTC</td>
                              <td style="padding:12px 0 4px;border-top:2px solid #2d4a3e;text-align:right;font-weight:700;color:#2d4a3e;font-size:18px;">%.2f TND</td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                      <!-- Footer -->
                      <tr>
                        <td style="background:#2d4a3e;padding:24px 40px;text-align:center;">
                          <p style="margin:0;color:#c8ddd4;font-size:12px;">Merci pour votre confiance. Notre équipe prépare votre commande avec soin.</p>
                          <p style="margin:8px 0 0;color:#8aab9a;font-size:11px;">© 2026 NaturEssence — contact@naturessence.tn</p>
                        </td>
                      </tr>

                    </table>
                  </td></tr>
                </table>
                </body></html>
                """.formatted(
                order.getFirstName(), date,
                order.getReference(), paymentLabel,
                order.getShippingZoneName() != null ? order.getShippingZoneName() : "—",
                order.getAddress() != null ? order.getAddress() : "—",
                order.getCity() != null ? order.getCity() : "",
                order.getPostalCode() != null ? order.getPostalCode() : "",
                rows.toString(),
                subtotal, shippingLine,
                couponRow, tvaRow,
                total
        );
    }

    // ── Newsletter bulk send ───────────────────────────────────────────────────

    @Async
    public void sendNewsletter(List<User> recipients, String subject, String htmlContent) {
        if (recipients == null || recipients.isEmpty()) return;
        // Brevo allows up to 50 recipients per request; batch accordingly
        final int BATCH = 50;
        RestTemplate rt = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("api-key", apiKey);

        for (int i = 0; i < recipients.size(); i += BATCH) {
            List<User> batch = recipients.subList(i, Math.min(i + BATCH, recipients.size()));
            List<Map<String, String>> toList = new ArrayList<>();
            for (User u : batch) {
                toList.add(Map.of("email", u.getEmail(), "name",
                        (u.getFirstName() != null ? u.getFirstName() : "") + " " +
                        (u.getLastName()  != null ? u.getLastName()  : "")));
            }
            java.util.HashMap<String, Object> body = new java.util.HashMap<>();
            body.put("sender",      Map.of("name", senderName, "email", senderEmail));
            body.put("to",          toList);
            body.put("replyTo",     Map.of("email", replyTo));
            body.put("subject",     subject);
            body.put("htmlContent", htmlContent);

            try {
                HttpEntity<java.util.HashMap<String, Object>> req = new HttpEntity<>(body, headers);
                ResponseEntity<String> resp = rt.postForEntity(BREVO_URL, req, String.class);
                if (resp.getStatusCode().is2xxSuccessful()) {
                    log.info("[Brevo] Newsletter batch {}/{} sent ({} recipients)", i / BATCH + 1,
                            (recipients.size() + BATCH - 1) / BATCH, batch.size());
                } else {
                    log.warn("[Brevo] Newsletter batch failed: {}", resp.getBody());
                }
            } catch (Exception e) {
                log.error("[Brevo] Newsletter batch error: {}", e.getMessage());
            }
        }
    }
}
