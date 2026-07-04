# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

# En producción el frontend llama al backend vía el proxy nginx (/api/)
ENV VITE_API_BASE_URL=/api

RUN npm run build

# ── Stage 2: Runtime ──────────────────────────────────────────────────────────
FROM nginx:alpine

# Certificado autofirmado de respaldo generado UNA VEZ en build time (no en
# runtime) — evita depender de openssl/entropía/permisos del host en cada
# arranque del contenedor, que puede fallar de forma distinta según el SO.
RUN apk add --no-cache --virtual .certgen openssl \
    && mkdir -p /etc/nginx/certs-fallback \
    && openssl req -x509 -nodes -newkey rsa:2048 \
        -keyout /etc/nginx/certs-fallback/gasnova.key \
        -out /etc/nginx/certs-fallback/gasnova.crt \
        -days 3650 \
        -subj "/CN=gasnova.local" \
        -addext "subjectAltName=DNS:gasnova.local,DNS:gasnova,DNS:localhost" \
    && apk del .certgen

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker-entrypoint.d/05-generate-fallback-cert.sh /docker-entrypoint.d/05-generate-fallback-cert.sh
RUN chmod +x /docker-entrypoint.d/05-generate-fallback-cert.sh

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
