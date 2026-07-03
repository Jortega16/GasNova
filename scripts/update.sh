#!/bin/bash
# Actualiza GasNova desde GitHub Container Registry (ghcr.io)
# Los datos en PostgreSQL (volumen gasnova_data) se conservan
#
# Uso:
#   bash update.sh              → descarga la versión :latest
#   bash update.sh v1.1.0       → descarga una versión específica
#   bash update.sh gasnova.tar  → carga desde archivo local .tar.gz

set -e

ARG=${1:-latest}
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "══════════════════════════════════════════════"
echo "  GasNova — Actualización"
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

# ── Caso 2: versión de ghcr.io ──────────────────────────────────────────────
else
  TAG="$ARG"
  echo "▶ Descargando imágenes versión '${TAG}' desde ghcr.io..."
  docker pull "ghcr.io/jortega16/gasnova-backend:${TAG}"
  docker pull "ghcr.io/jortega16/gasnova-frontend:${TAG}"

  # Apuntar el compose a las imágenes descargadas
  export BACKEND_IMAGE="ghcr.io/jortega16/gasnova-backend:${TAG}"
  export FRONTEND_IMAGE="ghcr.io/jortega16/gasnova-frontend:${TAG}"
fi

echo ""
echo "▶ Reiniciando servicios..."
docker compose stop gasnova-frontend gasnova-backend 2>/dev/null || true
docker compose up -d

echo ""
echo "══════════════════════════════════════════════"
echo "  ✓ GasNova actualizado"
echo ""
echo "  Frontend: http://localhost"
echo "  Backend:  http://localhost:8002/docs"
echo "══════════════════════════════════════════════"
