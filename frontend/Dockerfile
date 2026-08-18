# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

# En producción el frontend llama al backend vía el proxy nginx (/api/)
ENV VITE_API_BASE_URL=/api

# Commit corto y fecha de build (docker compose build --build-arg
# GIT_COMMIT=$(git rev-parse --short HEAD) --build-arg
# BUILD_TIME=$(date -u +%Y-%m-%dT%H:%M:%SZ)) — Vite los expone en el bundle
# vía import.meta.env.VITE_*. Sin argumento quedan en "unknown".
ARG GIT_COMMIT=unknown
ARG BUILD_TIME=unknown
ARG APP_VERSION=unknown
ENV VITE_GIT_COMMIT=$GIT_COMMIT
ENV VITE_BUILD_TIME=$BUILD_TIME
ENV VITE_APP_VERSION=$APP_VERSION

RUN npm run build

# ── Stage 2: Runtime ──────────────────────────────────────────────────────────
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
