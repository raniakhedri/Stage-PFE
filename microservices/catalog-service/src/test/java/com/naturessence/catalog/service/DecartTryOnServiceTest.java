package com.naturessence.catalog.service;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

class DecartTryOnServiceTest {

    @Test
    void createClientToken_failsWhenTheKeyIsMissing() {
        DecartTryOnService service = new DecartTryOnService();
        ReflectionTestUtils.setField(service, "apiKey", "  ");
        ReflectionTestUtils.setField(service, "apiUrl", "https://api.example.test");
        ReflectionTestUtils.setField(service, "sessionSeconds", 45);

        assertThatThrownBy(service::createClientToken)
            .isInstanceOf(ResponseStatusException.class)
            .extracting(ex -> ((ResponseStatusException) ex).getStatusCode())
            .isEqualTo(HttpStatus.SERVICE_UNAVAILABLE);
    }

    @Test
    void createClientToken_reportsAGatewayErrorWhenDecartIsUnreachable() {
        DecartTryOnService service = new DecartTryOnService();
        ReflectionTestUtils.setField(service, "apiKey", "test-key");
        ReflectionTestUtils.setField(service, "apiUrl", "http://127.0.0.1:9");
        ReflectionTestUtils.setField(service, "sessionSeconds", 30);

        assertThatThrownBy(service::createClientToken)
            .isInstanceOf(ResponseStatusException.class)
            .extracting(ex -> ((ResponseStatusException) ex).getStatusCode())
            .isEqualTo(HttpStatus.BAD_GATEWAY);
    }
}
