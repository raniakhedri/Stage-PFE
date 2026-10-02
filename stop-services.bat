@echo off
title Stop Spring Boot Services

echo ==========================================
echo Stopping services on ports 8080-8084...
echo ==========================================

for %%P in (8080 8081 8082 8083 8084) do (
    echo.
    echo Checking port %%P...

    for /f "tokens=5" %%A in ('netstat -aon ^| findstr :%%P ^| findstr LISTENING') do (
        echo Killing PID %%A on port %%P...
        taskkill /F /PID %%A
    )
)

echo.
echo ==========================================
echo All services stopped.
echo ==========================================

pause