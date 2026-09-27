package com.naturessence.catalog.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class DecartTryOnService {

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final HttpClient HTTP = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(15))
        .build();

    @Value("${decart.api-key:}")
    private String apiKey;

    @Value("${decart.api-url:https://api.decart.ai}")
    private String apiUrl;

    @Value("${decart.session-seconds:45}")
    private int sessionSeconds;

    public Map<String, Object> createClientToken() {
        if (apiKey == null || apiKey.isBlank()) {
            throw new ResponseStatusException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "DECART_API_KEY is not configured on catalog-service"
            );
        }

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("expiresIn", 600);

        try {
            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(apiUrl.replaceAll("/$", "") + "/v1/client/tokens"))
                .timeout(Duration.ofSeconds(20))
                .header("x-api-key", apiKey)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(MAPPER.writeValueAsString(body)))
                .build();

            HttpResponse<String> response = HTTP.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Decart token request failed: " + response.statusCode() + " " + response.body()
                );
            }

            JsonNode json = MAPPER.readTree(response.body());
            Map<String, Object> out = new LinkedHashMap<>();
            out.put("apiKey", json.path("apiKey").asText());
            out.put("expiresAt", json.path("expiresAt").asText(null));
            out.put("sessionSeconds", sessionSeconds);
            return out;
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                e.getMessage() != null ? e.getMessage() : "Decart token request failed"
            );
        }
    }
}
