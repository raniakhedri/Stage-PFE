package com.naturessence.order;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.boot.autoconfigure.domain.EntityScan;

@SpringBootApplication
@ComponentScan(basePackages = {
    "com.naturessence.order",
    "com.naturessence.shared"
})
@EnableJpaRepositories(basePackages = {
    "com.naturessence.shared.repository"
})
@EntityScan(basePackages = {
    "com.naturessence.shared.entity"
})
public class OrderServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(OrderServiceApplication.class, args);
    }
}
