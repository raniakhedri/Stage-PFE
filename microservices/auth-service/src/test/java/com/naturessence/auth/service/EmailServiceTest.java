package com.naturessence.auth.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;

import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.naturessence.shared.entity.User;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;

class EmailServiceTest {

    @Test
    void sendSignupCode_doesNotCallBrevoWhenTheKeyIsMissingAndLogsTheCode() {
        EmailService service = new EmailService();
        Logger logger = (Logger) LoggerFactory.getLogger(EmailService.class);
        ListAppender<ILoggingEvent> appender = new ListAppender<>();
        appender.start();
        logger.addAppender(appender);
        try {
            assertThatCode(() -> service.sendSignupCode("ada@example.com", "Ada", "123456")).doesNotThrowAnyException();
        } finally {
            logger.detachAppender(appender);
        }

        assertThat(appender.list).anyMatch(event ->
            event.getFormattedMessage().contains("123456") && event.getFormattedMessage().contains("ada@example.com")
        );
    }

    @Test
    void sendAccountInvite_escapesTheNameInTheLoggedFallback() {
        EmailService service = new EmailService();
        User user = User.builder()
            .firstName("Ada <script>")
            .lastName("Test")
            .email("ada@example.com")
            .password("hash")
            .build();
        Logger logger = (Logger) LoggerFactory.getLogger(EmailService.class);
        ListAppender<ILoggingEvent> appender = new ListAppender<>();
        appender.start();
        logger.addAppender(appender);
        try {
            service.sendAccountInvite(user, "Tmp-test12", "Boutique", null, true);
        } finally {
            logger.detachAppender(appender);
        }

        assertThat(appender.list).anyMatch(event -> event.getFormattedMessage().contains("Tmp-test12"));
    }
}
