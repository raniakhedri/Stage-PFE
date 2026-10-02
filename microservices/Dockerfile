# syntax=docker/dockerfile:1.7
# One image per Sellio service, built from the Maven reactor:
#   docker build --build-arg SERVICE=auth-service -t sellio/auth-service .
#   docker build --build-arg SERVICE=analytics-service --target analytics -t sellio/analytics-service .

# ── Build ────────────────────────────────────────────────────
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /build
COPY pom.xml .
COPY shared-lib shared-lib
COPY auth-service auth-service
COPY catalog-service catalog-service
COPY order-service order-service
COPY marketing-service marketing-service
COPY analytics-service analytics-service
COPY api-gateway api-gateway
ARG SERVICE
RUN --mount=type=cache,target=/root/.m2 \
    mvn -B -q -pl ${SERVICE} -am package -DskipTests \
 && cp ${SERVICE}/target/${SERVICE}-*.jar /build/app.jar

# ── Java services (auth, catalog, order, marketing, gateway) ──
FROM eclipse-temurin:17-jre AS service
RUN useradd --system --uid 10001 sellio
WORKDIR /app
COPY --from=build /build/app.jar app.jar
USER sellio
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75"
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]

# ── Analytics: Java + Python (scikit-learn models run as subprocesses) ──
FROM python:3.12-slim AS analytics
COPY --from=eclipse-temurin:17-jre /opt/java/openjdk /opt/java/openjdk
ENV JAVA_HOME=/opt/java/openjdk PATH="/opt/java/openjdk/bin:${PATH}" CHURN_PYTHON=python
RUN useradd --system --uid 10001 sellio
WORKDIR /app
COPY analytics-service/python/requirements.txt python/requirements.txt
RUN pip install --no-cache-dir -r python/requirements.txt
COPY analytics-service/python python
COPY --from=build /build/app.jar app.jar
USER sellio
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75"
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]

# Default target: a Java service.
FROM service
