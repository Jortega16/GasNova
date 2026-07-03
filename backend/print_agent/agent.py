"""
Agente de impresión local — GasNova.

Corre en CADA PC que tenga una impresora térmica conectada por USB.
El backend central (en la PC servidor, accesible en https://gasnova.local)
le reenvía los bytes ESC/POS a este agente vía HTTP cuando la estación
configurada en Ajustes usa el modo "Agente remoto".

No requiere el resto del backend (FastAPI/SQLAlchemy) — solo
`pts2_api/printer_engine.py`, que debe estar en la carpeta padre.

Uso:
    python agent.py               # escucha en 0.0.0.0:9200
    python agent.py --port 9300   # puerto alternativo
"""

from __future__ import annotations

import argparse
import base64
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn

from pts2_api.printer_engine import detect_local_printer, list_printers, send_raw

app = FastAPI(title="GasNova Print Agent")


class PrintRawRequest(BaseModel):
    data_b64: str
    printer_name: str | None = None


@app.get("/health")
def health():
    return {"ok": True, "service": "gasnova-print-agent"}


@app.get("/printers")
def printers():
    all_printers = list_printers()
    active = detect_local_printer()
    return {"printers": all_printers, "active": active}


@app.post("/print-raw")
def print_raw(req: PrintRawRequest):
    try:
        data = base64.b64decode(req.data_b64)
    except Exception:
        raise HTTPException(status_code=400, detail="data_b64 inválido")

    printer = req.printer_name or detect_local_printer()
    if not printer:
        raise HTTPException(status_code=503, detail="No hay impresora disponible en esta PC")

    ok, msg = send_raw(data, printer)
    if not ok:
        raise HTTPException(status_code=500, detail=f"Error de impresión: {msg}")

    return {"ok": True, "printer": printer, "bytes_sent": len(data), "message": msg}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Agente de impresión local de GasNova")
    parser.add_argument("--port", type=int, default=9200)
    parser.add_argument("--host", default="0.0.0.0")
    args = parser.parse_args()

    print(f"GasNova Print Agent escuchando en {args.host}:{args.port}")
    print(f"Impresoras detectadas: {list_printers()}")
    uvicorn.run(app, host=args.host, port=args.port)
