#!/bin/sh
# Genera automáticamente, la primera vez que arranca esta instalación:
#   1. Una CA (autoridad certificadora) propia — persistida en el volumen
#      montado ./certs, así que se crea una sola vez y se reutiliza en cada
#      reinicio/actualización.
#   2. Un certificado para gasnova.local firmado por esa CA.
#
# No requiere ejecutar ningún script manualmente. Lo único que sigue siendo
# manual (por diseño: ninguna herramienta puede saltarse esto de forma
# segura) es instalar la CA como confiable en cada dispositivo que acceda —
# se puede hacer visitando http://<esta-pc>/gasnova-ca.crt desde el
# navegador de ese dispositivo e importando el certificado.
#
# Si por cualquier motivo la generación falla (permisos, entropía, etc.), se
# usa un certificado autofirmado de respaldo ya incluido en la imagen, para
# que nginx siempre pueda arrancar.

CERT_DIR=/etc/nginx/certs
FALLBACK_DIR=/etc/nginx/certs-fallback
CA_KEY="$CERT_DIR/ca.key"
CA_CRT="$CERT_DIR/ca.crt"
CRT="$CERT_DIR/gasnova.crt"
KEY="$CERT_DIR/gasnova.key"

mkdir -p "$CERT_DIR" 2>/dev/null

use_fallback() {
    echo "[gasnova] Usando certificado autofirmado de respaldo (sin CA propia)."
    cp "$FALLBACK_DIR/gasnova.crt" "$CRT"
    cp "$FALLBACK_DIR/gasnova.key" "$KEY"
}

if [ -f "$CRT" ] && [ -f "$KEY" ]; then
    echo "[gasnova] Usando certificado existente en $CERT_DIR"
    exit 0
fi

# ── 1. Generar la CA propia de esta instalación (una sola vez) ─────────────
if [ ! -f "$CA_CRT" ] || [ ! -f "$CA_KEY" ]; then
    echo "[gasnova] Generando CA propia de esta instalación..."
    if ! openssl req -x509 -nodes -newkey rsa:2048 \
        -keyout "$CA_KEY" -out "$CA_CRT" -days 3650 \
        -subj "/CN=GasNova Local CA" \
        -addext "basicConstraints=critical,CA:TRUE" \
        -addext "keyUsage=critical,keyCertSign,cRLSign"; then
        echo "[gasnova] ADVERTENCIA: no se pudo generar la CA. Usando respaldo."
        use_fallback
        exit 0
    fi
fi

# ── 2. Generar el certificado de gasnova.local firmado por esa CA ──────────
echo "[gasnova] Generando certificado para gasnova.local firmado por la CA local..."
TMP_KEY="$CERT_DIR/.gasnova.key.tmp"
TMP_CSR="$CERT_DIR/.gasnova.csr.tmp"
TMP_EXT="$CERT_DIR/.gasnova.ext.tmp"

cat > "$TMP_EXT" <<EOF
subjectAltName=DNS:gasnova.local,DNS:gasnova,DNS:localhost,IP:127.0.0.1
EOF

if openssl req -nodes -newkey rsa:2048 \
        -keyout "$TMP_KEY" -out "$TMP_CSR" \
        -subj "/CN=gasnova.local" \
    && openssl x509 -req -in "$TMP_CSR" \
        -CA "$CA_CRT" -CAkey "$CA_KEY" -CAcreateserial \
        -out "$CRT" -days 825 -extfile "$TMP_EXT"; then
    mv "$TMP_KEY" "$KEY"
    chmod 644 "$CA_CRT"
    echo "[gasnova] Certificado generado y firmado correctamente."
    echo "[gasnova] Para que otros dispositivos confíen sin advertencias, visitar"
    echo "[gasnova]   http://<IP-o-nombre-de-esta-PC>/gasnova-ca.crt"
    echo "[gasnova] desde el navegador de cada dispositivo e instalar el certificado."
else
    echo "[gasnova] ADVERTENCIA: no se pudo firmar el certificado. Usando respaldo."
    use_fallback
fi

rm -f "$TMP_KEY" "$TMP_CSR" "$TMP_EXT" 2>/dev/null
