package com.naturessence.auth.service;

import com.naturessence.shared.entity.User;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

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
    public void sendAccountInvite(User user, String tempPassword) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("api-key", apiKey);

            String html = buildAccountInviteHtml(user, tempPassword);

            java.util.HashMap<String, Object> body = new java.util.HashMap<>();
            body.put("sender",      Map.of("name", senderName, "email", senderEmail));
            body.put("to",          List.of(Map.of("email", user.getEmail(),
                                                   "name",  user.getFirstName() + " " + user.getLastName())));
            body.put("replyTo",     Map.of("email", replyTo));
            body.put("subject",     "Bienvenue sur NaturEssence — Vos identifiants de connexion");
            body.put("htmlContent", html);

            log.info("[Brevo] Sending account invite to {}", user.getEmail());
            HttpEntity<java.util.HashMap<String, Object>> request = new HttpEntity<>(body, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(BREVO_URL, request, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("[Brevo] Account invite sent successfully to {}", user.getEmail());
            } else {
                log.warn("[Brevo] Non-2xx response {}: {}", response.getStatusCode(), response.getBody());
            }
        } catch (org.springframework.web.client.HttpClientErrorException e) {
            log.error("[Brevo] HTTP {} error sending invite: {}", e.getStatusCode(), e.getResponseBodyAsString());
        } catch (Exception e) {
            log.error("[Brevo] Failed to send account invite to {}: {} — {}", user.getEmail(), e.getClass().getSimpleName(), e.getMessage());
        }
    }

    private String buildAccountInviteHtml(User user, String tempPassword) {
        String loginUrl = "http://localhost:3000/login";
        return """
                <!DOCTYPE html>
                <html lang="fr">
                <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
                <title>Bienvenue sur NaturEssence</title></head>
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

                      <!-- Welcome -->
                      <tr>
                        <td style="padding:36px 40px 24px;text-align:center;border-bottom:1px solid #f0ebe3;">
                          <div style="width:56px;height:56px;background:#e8f5e9;border-radius:50%%;margin:0 auto 16px;line-height:56px;font-size:28px;">🌿</div>
                          <h2 style="margin:0 0 8px;color:#2d4a3e;font-size:20px;">Bienvenue, %s !</h2>
                          <p style="margin:0;color:#5a7a6a;font-size:14px;">Un compte a été créé pour vous sur la plateforme NaturEssence.</p>
                        </td>
                      </tr>

                      <!-- Credentials -->
                      <tr>
                        <td style="padding:28px 40px;background:#faf8f5;">
                          <p style="margin:0 0 16px;font-size:13px;font-weight:700;color:#2d4a3e;text-transform:uppercase;letter-spacing:1px;">Vos identifiants de connexion</p>
                          <table width="100%%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="padding:10px 16px;background:#ffffff;border:1px solid #e8e0d5;border-radius:8px 8px 0 0;">
                                <p style="margin:0 0 2px;font-size:10px;color:#8aab9a;text-transform:uppercase;letter-spacing:1px;">Adresse email</p>
                                <p style="margin:0;font-size:15px;font-weight:600;color:#2d4a3e;">%s</p>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:10px 16px;background:#ffffff;border:1px solid #e8e0d5;border-top:none;border-radius:0 0 8px 8px;">
                                <p style="margin:0 0 2px;font-size:10px;color:#8aab9a;text-transform:uppercase;letter-spacing:1px;">Mot de passe temporaire</p>
                                <p style="margin:0;font-size:15px;font-weight:700;color:#2d4a3e;font-family:monospace;letter-spacing:2px;">%s</p>
                              </td>
                            </tr>
                          </table>
                          <p style="margin:16px 0 0;font-size:12px;color:#8aab9a;">⚠️ Pensez à changer votre mot de passe après votre première connexion.</p>
                        </td>
                      </tr>

                      <!-- CTA -->
                      <tr>
                        <td style="padding:32px 40px;text-align:center;">
                          <a href="%s" style="display:inline-block;background:#2d4a3e;color:#f0c866;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:14px;font-weight:600;letter-spacing:1px;">Se connecter</a>
                        </td>
                      </tr>

                      <!-- Footer -->
                      <tr>
                        <td style="background:#2d4a3e;padding:24px 40px;text-align:center;">
                          <p style="margin:0;color:#c8ddd4;font-size:12px;">Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
                          <p style="margin:8px 0 0;color:#8aab9a;font-size:11px;">© 2026 NaturEssence — contact@naturessence.tn</p>
                        </td>
                      </tr>

                    </table>
                  </td></tr>
                </table>
                </body></html>
                """.formatted(user.getFirstName(), user.getEmail(), tempPassword, loginUrl);
    }
}
