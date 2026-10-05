package com.naturessence.gateway;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class ApiGatewayApplication {

    public static void main(String[] args) {
        SpringApplication.run(ApiGatewayApplication.class, args);
    }

    /** Service addresses: localhost when run from the IDE, container names under Docker Compose. */
    @Bean
    public RouteLocator routes(RouteLocatorBuilder builder,
                               @Value("${AUTH_SERVICE_URL:http://localhost:8081}") String auth,
                               @Value("${CATALOG_SERVICE_URL:http://localhost:8082}") String catalog,
                               @Value("${ORDER_SERVICE_URL:http://localhost:8083}") String order,
                               @Value("${MARKETING_SERVICE_URL:http://localhost:8084}") String marketing,
                               @Value("${ANALYTICS_SERVICE_URL:http://localhost:8085}") String analytics) {
        return builder
            .routes()
            .route("auth-service", r ->
                r
                    .path(
                        "/api/v1/auth/**",
                        "/api/v1/public/shops",
                        "/api/v1/public/shops/**",
                        "/api/v1/admin/platform",
                        "/api/v1/admin/platform/**",
                        "/api/v1/profile",
                        "/api/v1/profile/loyalty",
                        "/api/v1/profile/loyalty/**",
                        "/api/v1/profile/cart",
                        "/api/v1/profile/cart/**",
                        "/api/v1/admin/users/**",
                        "/api/v1/admin/roles/**",
                        "/api/v1/admin/segments/**",
                        "/api/v1/admin/loyalty/**"
                    )
                    .uri(auth)
            )
            .route("catalog-service", r ->
                r
                    .path(
                        "/api/v1/public/products/**",
                        "/api/v1/public/tryon/**",
                        "/api/v1/public/categories/**",
                        "/api/v1/public/collections/**",
                        "/api/v1/public/reviews/**",
                        "/api/v1/profile/reviews",
                        "/api/v1/profile/reviews/**",
                        "/api/v1/reviews/**",
                        "/api/v1/admin/products",
                        "/api/v1/admin/products/**",
                        "/api/v1/admin/categories",
                        "/api/v1/admin/categories/**",
                        "/api/v1/admin/collections",
                        "/api/v1/admin/collections/**",
                        "/api/v1/admin/reviews",
                        "/api/v1/admin/reviews/**",
                        "/api/v1/admin/upload",
                        "/api/v1/admin/upload/**",
                        "/uploads/**"
                    )
                    .uri(catalog)
            )
            .route("order-service", r ->
                r
                    .path(
                        "/api/v1/public/checkout/**",
                        "/api/v1/public/stripe/**",
                        "/api/v1/public/coupons/**",
                        "/api/v1/public/return-policy/**",
                        "/api/v1/profile/orders",
                        "/api/v1/profile/orders/**",
                        "/api/v1/profile/returns",
                        "/api/v1/profile/returns/**",
                        "/api/v1/admin/orders",
                        "/api/v1/admin/orders/**",
                        "/api/v1/admin/returns",
                        "/api/v1/admin/returns/**",
                        "/api/v1/admin/tva-shipping/**",
                        "/api/v1/admin/promotions/**",
                        "/api/v1/admin/dashboard/**"
                    )
                    .uri(order)
            )
            .route("marketing-service", r ->
                r
                    .path(
                        "/api/v1/public/banners/**",
                        "/api/v1/public/appearance/**",
                        "/api/v1/public/store",
                        "/api/v1/public/store/**",
                        "/api/v1/admin/banners/**",
                        "/api/v1/admin/appearance/**",
                        "/api/v1/admin/store",
                        "/api/v1/admin/store/**",
                        "/api/v1/admin/email/**"
                    )
                    .uri(marketing)
            )
            .route("analytics-service", r ->
                r.path("/api/v1/analytics/**").uri(analytics)
            )
            .build();
    }
}
