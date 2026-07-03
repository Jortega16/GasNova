#!/bin/bash
# Construye las imágenes de GasNova y las exporta como un archivo .tar.gz
# Uso: bash scripts/build.sh [VERSION]
# Ejemplo: bash scripts/build.sh 1.0.0

set -e

VERSION=${1:-latest}
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUTPUT="${ROOT}/gasnova-${VERSION}.tar.gz"

echo "══════════════════════════════════════════════"
echo "  GasNova Build — versión ${VERSION}"
echo "══════════════════════════════════════════════"

cd "$ROOT"

echo ""
echo "▶ Construyendo imágenes Docker..."
docker compose build

echo ""
echo "▶ Exportando a ${OUTPUT} (puede tardar varios minutos)..."
docker save \
  gasnova-gasnova-frontend:latest \
  gasnova-gasnova-backend:latest \
  postgres:16-alpine \
  | gzip > "$OUTPUT"

SIZE=$(du -sh "$OUTPUT" | cut -f1)
echo ""
echo "══════════════════════════════════════════════"
echo "  ✓ Exportado: gasnova-${VERSION}.tar.gz (${SIZE})"
echo ""
echo "  Para instalar en otra PC:"
echo "  1. Copiar gasnova-${VERSION}.tar.gz a la PC destino"
echo "  2. Copiar docker-compose.yml y backend/.env a la PC destino"
echo "  3. En la PC destino: bash install.sh gasnova-${VERSION}.tar.gz"
echo "══════════════════════════════════════════════"
