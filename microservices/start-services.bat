@echo off
title Start Spring Boot Services

echo ==========================================
echo Starting Spring Boot microservices...
echo ==========================================

start "Auth Service" cmd /k "mvn spring-boot:run -pl auth-service"

timeout /t 2 /nobreak >nul

start "Catalog Service" cmd /k "mvn spring-boot:run -pl catalog-service"

timeout /t 2 /nobreak >nul

start "Order Service" cmd /k "mvn spring-boot:run -pl order-service"

timeout /t 2 /nobreak >nul

start "Marketing Service" cmd /k "mvn spring-boot:run -pl marketing-service"

timeout /t 2 /nobreak >nul

start "API Gateway" cmd /k "mvn spring-boot:run -pl api-gateway"

echo.
echo ==========================================
echo All services launched.
echo ==========================================

pause
