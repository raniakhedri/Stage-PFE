@echo off
title Start Sellio microservices
rem Starts every Spring Boot service in its own window. Run from the microservices folder.
rem Secrets (database, JWT, Brevo, Stripe) are read from microservices\.env (copy .env.example).

cd /d %~dp0
echo ==========================================
echo Building shared-lib...
echo ==========================================
call mvn -q install -pl shared-lib -DskipTests || goto :error

for %%S in (auth-service catalog-service order-service marketing-service analytics-service api-gateway) do (
    echo Starting %%S...
    start "%%S" cmd /k "mvn spring-boot:run -pl %%S"
    timeout /t 3 /nobreak >nul
)

echo.
echo All services launched: gateway http://localhost:8080 (auth 8081, catalog 8082, order 8083, marketing 8084, analytics 8085)
goto :eof

:error
echo shared-lib build failed.
exit /b 1
