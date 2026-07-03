#!/bin/bash
# Instala GasNova en esta PC
# Requisito: Docker Desktop instalado y en ejecución
#
# Uso:
#   bash install.sh                  → descarga :latest desde ghcr.io
#   bash install.sh v1.0.0           → versión específica desde ghcr.io
#   bash install.sh gasnova-1.0.tar.gz → desde archivo local

set -e

ARG=${1:-latest}
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "══════════════════════════════════════════════"
echo "  GasNova — Instalación"
echo "══════════════════════════════════════════════"
echo ""

# ── Caso 1: archivo local .tar.gz ───────────────────────────────────────────
if [[ "$ARG" == *.tar* ]]; then
  if [ ! -f "$ARG" ]; then
    echo "Error: no se encuentra el archivo '${ARG}'"
    exit 1
  fi
  echo "▶ Cargando imágenes desde ${ARG}..."
  gunzip -c "$ARG" | docker load

# ── Caso 2: desde ghcr.io ───────────────────────────────────────────────────
else
  TAG="$ARG"
  echo "▶ Descargando imágenes versión '${TAG}' desde ghcr.io..."
  echo "  (Las imágenes son públicas — no requiere login)"
  docker pull "ghcr.io/jortega16/gasnova-backend:${TAG}"
  docker pull "ghcr.io/jortega16/gasnova-frontend:${TAG}"
  docker pull postgres:16-alpine

  export BACKEND_IMAGE="ghcr.io/jortega16/gasnova-backend:${TAG}"
  export FRONTEND_IMAGE="ghcr.io/jortega16/gasnova-frontend:${TAG}"
fi

echo ""
echo "▶ Iniciando todos los servicios..."
docker compose up -d

echo ""
echo "══════════════════════════════════════════════"
echo "  ✓ GasNova instalado y corriendo"
echo ""
echo "  Frontend: http://localhost"
echo "  Backend:  http://localhost:8002/docs"
echo "══════════════════════════════════════════════"
