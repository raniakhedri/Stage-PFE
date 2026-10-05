# syntax=docker/dockerfile:1.7
# Storefront or backoffice, built with Vite and served by nginx:
#   docker build --build-arg APP=storefront -t sellio/storefront .
#   docker build --build-arg APP=backoffice -t sellio/backoffice .
# VITE_* values are public (they end up in the JavaScript sent to browsers).

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY frontoffice/package.json frontoffice/
COPY backoffice/package.json backoffice/
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund
COPY . .
ARG APP=storefront
ARG VITE_API_BASE_URL=http://localhost:8080/api/v1
ARG VITE_STOREFRONT_URL=http://localhost:3001
ARG VITE_BACKOFFICE_URL=http://localhost:3000
ARG VITE_STRIPE_PUBLISHABLE_KEY=
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL VITE_STOREFRONT_URL=$VITE_STOREFRONT_URL \
    VITE_BACKOFFICE_URL=$VITE_BACKOFFICE_URL VITE_STRIPE_PUBLISHABLE_KEY=$VITE_STRIPE_PUBLISHABLE_KEY
RUN if [ "$APP" = "backoffice" ]; then cd backoffice && npx vite build --outDir /out; else npx vite build --outDir /out; fi

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /out /usr/share/nginx/html
EXPOSE 80
