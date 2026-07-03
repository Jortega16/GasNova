"""
Motor de impresión ESC/POS compartido entre el backend central y el
agente de impresión local (backend/print_agent/agent.py).

Solo depende de la librería estándar (+ pywin32 opcional en Windows),
para que el agente pueda correr como un proceso independiente y liviano
en cada PC, sin necesitar el resto de dependencias del backend (FastAPI,
SQLAlchemy, etc.).
"""

from __future__ import annotations

import os
import platform
import re
import socket
import subprocess
import tempfile
from typing import List, Optional


def list_printers() -> List[str]:
    """Lista todas las impresoras locales disponibles (CUPS en Unix, Spooler en Windows)."""
    if platform.system() == "Windows":
        try:
            import win32print
            printers = win32print.EnumPrinters(
                win32print.PRINTER_ENUM_LOCAL | win32print.PRINTER_ENUM_CONNECTIONS
            )
            return [p[2] for p in printers]
        except Exception as e:
            print(f"[printer_engine] Error enumerando impresoras en Windows: {e}")
            return []

    try:
        result = subprocess.run(["lpstat", "-a"], capture_output=True, text=True)
        printers = []
        for line in result.stdout.splitlines():
            parts = line.strip().split()
            if parts:
                printers.append(parts[0])
        return printers
    except Exception as e:
        print(f"[printer_engine] Error listando impresoras en Unix: {e}")
        return []


def is_network_target(target: str) -> tuple[bool, str, int]:
    """Detecta si un identificador de impresora es una IP/host de red.

    Retorna (es_red, host, puerto). Acepta formatos: "tcp://host:port",
    "host:port", o una IP suelta (usa puerto 9100 por defecto).
    """
    t = target.strip()
    port = 9100
    if t.lower().startswith("tcp://"):
        t = t[6:]

    if ":" in t:
        parts = t.split(":")
        if len(parts) == 2 and parts[1].isdigit():
            return True, parts[0], int(parts[1])

    if re.match(r"^(\d{1,3}\.){3}\d{1,3}$", t):
        return True, t, port

    return False, "", port


def detect_local_printer(configured: str = "") -> Optional[str]:
    """Retorna la impresora local configurada si existe, o la primera POS disponible."""
    if configured:
        is_net, _, _ = is_network_target(configured)
        if is_net:
            return configured

    all_printers = list_printers()

    if configured and configured in all_printers:
        return configured

    for p in all_printers:
        if "pos" in p.lower():
            return p

    return all_printers[0] if all_printers else None


def send_raw(data: bytes, printer_target: str) -> tuple[bool, str]:
    """Envía bytes ESC/POS crudos a la impresora (USB/local o red TCP)."""
    is_net, host, port = is_network_target(printer_target)

    if is_net:
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.settimeout(10.0)
                s.connect((host, port))
                s.sendall(data)
            return True, f"Impreso exitosamente vía red TCP: {host}:{port}"
        except Exception as e:
            return False, f"Error imprimiendo en red a {host}:{port}: {str(e)}"

    printer_name = printer_target

    if platform.system() == "Windows":
        try:
            import win32print
            hPrinter = win32print.OpenPrinter(printer_name)
            try:
                hJob = win32print.StartDocPrinter(hPrinter, 1, ("GasNova Ticket", None, "RAW"))
                try:
                    win32print.StartPagePrinter(hPrinter)
                    win32print.WritePrinter(hPrinter, data)
                    win32print.EndPagePrinter(hPrinter)
                finally:
                    win32print.EndDocPrinter(hPrinter)
            finally:
                win32print.ClosePrinter(hPrinter)
            return True, f"Impreso exitosamente en Windows: {printer_name}"
        except Exception as e:
            return False, str(e)

    # Unix fallback (CUPS lp -o raw)
    with tempfile.NamedTemporaryFile(mode="wb", suffix=".bin", delete=False) as f:
        f.write(data)
        tmp_path = f.name

    try:
        result = subprocess.run(
            ["lp", "-d", printer_name, "-o", "raw", tmp_path],
            capture_output=True, text=True, timeout=15,
        )
        msg = result.stdout.strip() or result.stderr.strip()
        print(f"[printer_engine] printer={printer_name} rc={result.returncode} {msg}")
        return result.returncode == 0, msg
    except subprocess.TimeoutExpired:
        return False, "Timeout enviando a impresora"
    except Exception as e:
        return False, str(e)
    finally:
        try:
            os.unlink(tmp_path)
        except Exception:
            pass
