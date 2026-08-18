package com.naturessence.analytics;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
@ComponentScan(
    basePackages = { "com.naturessence.analytics", "com.naturessence.shared" }
)
@EnableJpaRepositories(basePackages = { "com.naturessence.shared.repository" })
@EntityScan(basePackages = { "com.naturessence.shared.entity" })
public class AnalyticsApplication {

    public static void main(String[] args) {
        SpringApplication.run(AnalyticsApplication.class, args);
    }
}
