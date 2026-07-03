#!/bin/bash
# Agente de impresión local GasNova — Linux/macOS
set -e
cd "$(dirname "$0")"

if [ ! -d ".venv" ]; then
  echo "Creando entorno virtual..."
  python3 -m venv .venv
fi

source .venv/bin/activate
pip install -q -r requirements.txt

echo ""
echo "══════════════════════════════════════════════"
echo "  GasNova Print Agent"
echo "  Escuchando en el puerto 9200"
echo "══════════════════════════════════════════════"
echo ""

python agent.py
