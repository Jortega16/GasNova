#!/bin/sh
# Copia el certificado autofirmado de respaldo (generado en build time, ver
# Dockerfile) a /etc/nginx/certs si el volumen montado está vacío — así
# "docker compose up -d" funciona de inmediato sin pasos manuales, sin
# depender de openssl/entropía en tiempo de ejecución (eso falla de forma
# distinta según el host y dejaba el contenedor en loop de reinicio).
#
# Para un certificado de confianza (sin advertencia del navegador), correr
# scripts/generate-certs.sh con mkcert y reiniciar el contenedor: esto NO
# sobrescribe un certificado ya existente.
set -e

CERT_DIR=/etc/nginx/certs
FALLBACK_DIR=/etc/nginx/certs-fallback
CRT="$CERT_DIR/gasnova.crt"
KEY="$CERT_DIR/gasnova.key"

if [ ! -f "$CRT" ] || [ ! -f "$KEY" ]; then
    echo "[gasnova] No se encontró certificado en $CERT_DIR — usando el autofirmado de respaldo..."
    mkdir -p "$CERT_DIR"
    cp "$FALLBACK_DIR/gasnova.crt" "$CRT"
    cp "$FALLBACK_DIR/gasnova.key" "$KEY"
    echo "[gasnova] Certificado de respaldo copiado. El navegador mostrará advertencia hasta reemplazarlo con uno de mkcert (scripts/generate-certs.sh)."
else
    echo "[gasnova] Usando certificado existente en $CERT_DIR"
fi
