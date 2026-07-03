#!/bin/sh
# Genera un certificado HTTPS autofirmado temporal si no hay ninguno montado
# en /etc/nginx/certs — así "docker compose up -d" funciona de inmediato sin
# pasos manuales. Para un certificado de confianza (sin advertencia del
# navegador), correr scripts/generate-certs.sh con mkcert y reiniciar el
# contenedor: esto NO sobrescribe un certificado ya existente.
set -e

CERT_DIR=/etc/nginx/certs
CRT="$CERT_DIR/gasnova.crt"
KEY="$CERT_DIR/gasnova.key"

if [ ! -f "$CRT" ] || [ ! -f "$KEY" ]; then
    echo "[gasnova] No se encontró certificado en $CERT_DIR — generando uno autofirmado temporal..."
    mkdir -p "$CERT_DIR"
    openssl req -x509 -nodes -newkey rsa:2048 \
        -keyout "$KEY" -out "$CRT" -days 825 \
        -subj "/CN=gasnova.local" \
        -addext "subjectAltName=DNS:gasnova.local,DNS:gasnova,DNS:localhost" \
        >/dev/null 2>&1
    echo "[gasnova] Certificado autofirmado listo. El navegador mostrará advertencia hasta reemplazarlo con uno de mkcert (scripts/generate-certs.sh)."
else
    echo "[gasnova] Usando certificado existente en $CERT_DIR"
fi
