#!/bin/bash
# GasNova — instalación / actualización con un solo script.
#
# Descarga docker-compose.yml desde el repositorio y levanta (o actualiza)
# los contenedores. Correr este mismo script más adelante actualiza la
# instalación existente sin perder datos (el volumen de PostgreSQL persiste).
#
# Uso:
#   bash install.sh
#
# Requisitos: Docker Desktop / Docker Engine + Compose plugin instalados.
set -e

REPO_RAW="https://raw.githubusercontent.com/Jortega16/GasNova/main"
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

echo "══════════════════════════════════════════════"
echo "  GasNova — Instalación / Actualización"
echo "══════════════════════════════════════════════"

echo ""
echo "▶ Descargando docker-compose.yml..."
curl -fsSL "$REPO_RAW/docker-compose.yml" -o docker-compose.yml

mkdir -p backend backend/logs backend/reports

if [ ! -f backend/.env ]; then
    echo ""
    echo "▶ No existe backend/.env — descargando plantilla..."
    curl -fsSL "$REPO_RAW/backend/.env.example" -o backend/.env
    echo "⚠  Edita backend/.env y ajusta PTS2_HOST con la IP del controlador de esta estación."
else
    echo ""
    echo "▶ backend/.env ya existe — se conserva tal cual."
fi

# En Linux, el host no anuncia el hostname "gasnova" por mDNS por sí solo
# (a diferencia de Windows/macOS, donde basta con renombrar el equipo) —
# para eso el compose trae el servicio gasnova-mdns (avahi), pero está
# detrás de un profile para no correr un contenedor de red host/privileged
# innecesario en otros sistemas operativos.
#
# WSL2 (Docker Desktop en Windows, o Docker Engine corriendo dentro de una
# distro WSL) también reporta "Linux" en uname -s, pero su network_mode:
# host es la red virtual de la VM de WSL2, no la tarjeta de red física de
# la PC — el contenedor arranca sin error pero nunca llega a la LAN real.
# Ahí, igual que en Windows nativo, la forma que sí funciona es renombrar
# la PC como "gasnova" desde Configuración (ver README).
COMPOSE_PROFILE_ARGS=()
if [ "$(uname -s)" = "Linux" ] && ! uname -r | grep -qi microsoft; then
    echo ""
    echo "▶ Linux detectado — se activará el anuncio mDNS de gasnova.local (gasnova-mdns/avahi)."
    COMPOSE_PROFILE_ARGS=(--profile mdns)
elif [ "$(uname -s)" = "Linux" ]; then
    echo ""
    echo "▶ WSL2 detectado (Docker Desktop en Windows) — gasnova-mdns no sirve aquí, su red host es la VM interna de WSL2, no la red física."
    echo "  Para que esta PC responda en gasnova.local, renómbrala como \"gasnova\" desde Configuración de Windows (no dentro de WSL)."
fi

echo ""
echo "▶ Descargando la última versión de las imágenes..."
docker compose "${COMPOSE_PROFILE_ARGS[@]}" pull

echo ""
echo "▶ Levantando los contenedores..."
docker compose "${COMPOSE_PROFILE_ARGS[@]}" up -d

echo ""
echo "══════════════════════════════════════════════"
echo "  ✓ GasNova instalado/actualizado correctamente"
echo ""
echo "  Frontend:  http://localhost"
echo "  Backend:   http://localhost:8002/docs"
echo "  pgAdmin:   http://localhost:5050"
echo "══════════════════════════════════════════════"
