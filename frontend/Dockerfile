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

RUN apk add --no-cache openssl

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker-entrypoint.d/05-generate-fallback-cert.sh /docker-entrypoint.d/05-generate-fallback-cert.sh
RUN chmod +x /docker-entrypoint.d/05-generate-fallback-cert.sh

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
