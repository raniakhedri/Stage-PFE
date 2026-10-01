package com.naturessence.auth.service;

import com.naturessence.shared.entity.User;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import org.springframework.web.util.HtmlUtils;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Transactional e-mails of the auth service, sent through the Brevo API.
 * When {@code BREVO_API_KEY} is not configured nothing is sent: the message (with its code or
 * temporary password) is written to the log instead, so every flow stays testable locally.
 */
@Slf4j
@Service
public class EmailService {

    private static final String BREVO_URL = "https://api.brevo.com/v3/smtp/email";

    private static final HttpClient HTTP = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
    private static final ObjectMapper JSON = new ObjectMapper();

    @Value("${brevo.api-key:}")
    private String apiKey;

    @Value("${brevo.sender-email:}")
    private String senderEmail;

    @Value("${brevo.sender-name:Sellio}")
    private String senderName;

    @Value("${brevo.reply-to:}")
    private String replyTo;

    @Value("${app.backoffice-url:http://localhost:3000}")
    private String backofficeUrl;

    @Value("${app.storefront-url:http://localhost:3001}")
    private String storefrontUrl;

    /**
     * Account created from the backoffice. {@code shopSlug}/{@code shopName} brand the message;
     * team members sign in on Sellio, customers on the shop's storefront.
     */
    @Async
    public void sendAccountInvite(User user, String tempPassword, String shopName, String shopSlug, boolean teamMember) {
        String brand = shopName != null ? shopName : "Sellio";
        String loginUrl = teamMember || shopSlug == null
                ? backofficeUrl + "/login"
                : storefrontUrl + "/" + shopSlug + "/login";
        String intro = teamMember
                ? "Un compte a été créé pour vous dans l'équipe de <b>" + esc(brand) + "</b> sur Sellio."
                : "Un compte client a été créé pour vous sur la boutique <b>" + esc(brand) + "</b>.";
        String body = """
                <p style="margin:0 0 16px">Bonjour %s,</p>
                <p style="margin:0 0 20px">%s</p>
                <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f6f7f9;border:1px solid #e5e7eb;border-radius:10px">
                  <tr><td style="padding:14px 18px;border-bottom:1px solid #e5e7eb">
                    <div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:1px">E-mail</div>
                    <div style="font-size:15px;font-weight:600">%s</div></td></tr>
                  <tr><td style="padding:14px 18px">
                    <div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:1px">Mot de passe temporaire</div>
                    <div style="font-size:18px;font-weight:700;font-family:monospace;letter-spacing:2px">%s</div></td></tr>
                </table>
                <p style="margin:18px 0 0;font-size:13px;color:#b45309">Ce mot de passe ne sert qu'une fois : à la première connexion, vous devrez en choisir un nouveau.</p>
                """.formatted(esc(user.getFirstName()), intro, esc(user.getEmail()), esc(tempPassword));
        send(user.getEmail(), user.getFullName(), brand + " — Vos identifiants de connexion",
                layout(brand, body, "Se connecter", loginUrl),
                "invitation " + user.getEmail() + " / mot de passe temporaire : " + tempPassword);
    }

    /** Merchant sign-up: confirm the e-mail address with a six-digit code. */
    @Async
    public void sendSignupCode(String email, String firstName, String code) {
        String body = """
                <p style="margin:0 0 16px">Bonjour %s,</p>
                <p style="margin:0 0 20px">Voici votre code pour confirmer votre adresse e-mail et créer votre compte marchand Sellio :</p>
                %s
                <p style="margin:18px 0 0;font-size:13px;color:#6b7280">Le code expire dans 10 minutes. Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.</p>
                """.formatted(esc(firstName), codeBlock(code));
        send(email, firstName, "Sellio — Votre code de vérification", layout("Sellio", body, null, null),
                "code d'inscription " + email + " : " + code);
    }

    /** Password reset, for merchants (Sellio) and for a shop's customers. */
    @Async
    public void sendPasswordResetCode(User user, String code, String shopName) {
        String brand = shopName != null ? shopName : "Sellio";
        String body = """
                <p style="margin:0 0 16px">Bonjour %s,</p>
                <p style="margin:0 0 20px">Vous avez demandé à réinitialiser votre mot de passe. Saisissez ce code sur la page « Mot de passe oublié » :</p>
                %s
                <p style="margin:18px 0 0;font-size:13px;color:#6b7280">Le code expire dans 10 minutes. Si vous n'avez rien demandé, ignorez cet e-mail : votre mot de passe reste inchangé.</p>
                """.formatted(esc(user.getFirstName()), codeBlock(code));
        send(user.getEmail(), user.getFullName(), brand + " — Réinitialisation du mot de passe",
                layout(brand, body, null, null), "code de réinitialisation " + user.getEmail() + " : " + code);
    }

    // ── Internals ─────────────────────────────────────────────────────────────

    private void send(String to, String name, String subject, String html, String logLine) {
        if (apiKey == null || apiKey.isBlank() || senderEmail == null || senderEmail.isBlank()) {
            log.warn("[E-mail non envoyé — BREVO_API_KEY / BREVO_SENDER_EMAIL absents dans microservices/.env] {} — {}", subject, logLine);
            return;
        }
        try {
            Map<String, Object> body = new HashMap<>();
            body.put("sender", Map.of("name", senderName, "email", senderEmail));
            body.put("to", List.of(Map.of("email", to, "name", name == null || name.isBlank() ? to : name)));
            if (replyTo != null && !replyTo.isBlank()) body.put("replyTo", Map.of("email", replyTo));
            body.put("subject", subject);
            body.put("htmlContent", html);

            // java.net.http keeps the header name exactly "api-key" (Brevo answers 401 to "Api-Key").
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(BREVO_URL))
                    .timeout(Duration.ofSeconds(20))
                    .header("accept", "application/json")
                    .header("content-type", "application/json")
                    .header("api-key", apiKey.trim())
                    .POST(HttpRequest.BodyPublishers.ofString(JSON.writeValueAsString(body), StandardCharsets.UTF_8))
                    .build();
            HttpResponse<String> response = HTTP.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                log.info("[Brevo] « {} » envoyé à {}", subject, to);
            } else {
                log.error("[Brevo] HTTP {} : {} — {}", response.statusCode(), response.body(), logLine);
            }
        } catch (Exception e) {
            log.error("[Brevo] Échec de l'envoi à {} : {} — {}", to, e.getMessage(), logLine);
        }
    }

    private static String codeBlock(String code) {
        return "<div style=\"text-align:center;font-size:34px;font-weight:700;letter-spacing:10px;font-family:monospace;"
                + "background:#f6f7f9;border:1px solid #e5e7eb;border-radius:10px;padding:18px\">" + esc(code) + "</div>";
    }

    private static String layout(String brand, String content, String ctaLabel, String ctaUrl) {
        String cta = ctaLabel == null ? "" : """
                <tr><td style="padding:0 36px 32px;text-align:center">
                  <a href="%s" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:13px 32px;border-radius:8px;font-weight:600;font-size:14px">%s</a>
                </td></tr>""".formatted(esc(ctaUrl), esc(ctaLabel));
        return """
                <!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"></head>
                <body style="margin:0;padding:0;background:#f3f4f6;font-family:Helvetica,Arial,sans-serif;color:#111827">
                <table width="100%%" cellpadding="0" cellspacing="0" style="padding:32px 0"><tr><td align="center">
                  <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:14px;overflow:hidden">
                    <tr><td style="background:#111827;padding:24px 36px;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:.5px">%s</td></tr>
                    <tr><td style="padding:32px 36px;font-size:15px;line-height:1.55">%s</td></tr>
                    %s
                    <tr><td style="padding:18px 36px;background:#f9fafb;font-size:11px;color:#9ca3af">Envoyé via Sellio.</td></tr>
                  </table>
                </td></tr></table></body></html>
                """.formatted(esc(brand), content, cta);
    }

    private static String esc(String value) {
        return value == null ? "" : HtmlUtils.htmlEscape(value);
    }
}
