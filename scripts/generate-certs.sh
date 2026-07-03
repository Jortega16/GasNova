#!/bin/bash
# Genera el certificado HTTPS para gasnova.local en ./certs/
#
# Uso: bash scripts/generate-certs.sh [IP_DE_LA_ESTACION]
#
# Recomendado: instalar mkcert (https://github.com/FiloSottile/mkcert) para
# generar un certificado firmado por una CA local de confianza. Sin mkcert,
# se genera un certificado autofirmado (el navegador mostrará advertencia
# hasta que se acepte manualmente).

set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CERT_DIR="${ROOT}/certs"
STATION_IP=${1:-}

mkdir -p "$CERT_DIR"
cd "$CERT_DIR"

DOMAINS="gasnova.local gasnova localhost 127.0.0.1"
if [ -n "$STATION_IP" ]; then
  DOMAINS="$DOMAINS $STATION_IP"
fi

if command -v mkcert >/dev/null 2>&1; then
  echo "▶ Generando certificado con mkcert para: ${DOMAINS}"
  mkcert -install
  mkcert -cert-file gasnova.crt -key-file gasnova.key $DOMAINS

  echo ""
  echo "══════════════════════════════════════════════"
  echo "  ✓ Certificado confiable generado en ./certs/"
  echo ""
  echo "  Para que OTROS dispositivos (POS, tablets) confíen en"
  echo "  https://gasnova.local, copia la CA raíz e instálala ahí:"
  echo ""
  mkcert -CAROOT
  echo "  (copiar rootCA.pem desde esa carpeta e instalarlo como"
  echo "   certificado de confianza en cada dispositivo)"
  echo "══════════════════════════════════════════════"
else
  echo "⚠ mkcert no está instalado — generando certificado autofirmado."
  echo "  Los navegadores mostrarán advertencia de 'no seguro'."
  echo "  Instalar mkcert es recomendado: https://github.com/FiloSottile/mkcert"
  echo ""

  openssl req -x509 -nodes -newkey rsa:2048 \
    -keyout gasnova.key -out gasnova.crt -days 825 \
    -subj "/CN=gasnova.local" \
    -addext "subjectAltName=DNS:gasnova.local,DNS:gasnova,DNS:localhost${STATION_IP:+,IP:$STATION_IP}"

  echo ""
  echo "══════════════════════════════════════════════"
  echo "  ✓ Certificado autofirmado generado en ./certs/"
  echo "══════════════════════════════════════════════"
fi

echo ""
echo "▶ Reinicia el frontend para aplicar: docker compose restart gasnova-frontend"
