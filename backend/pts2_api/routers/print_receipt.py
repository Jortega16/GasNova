"""
Router de impresion termica - AON Business PR-255 / POS-80 (80mm).
Usa ESC/POS binario puro enviado via `lp -o raw` para:
  - Alineacion correcta (no espacios, comandos ESC a)
  - Corte automatico de papel (GS V)
  - Compatibilidad total con codepage CP850 (tildes en espanol)
"""

from __future__ import annotations

import base64
import json
import subprocess
import os
from datetime import datetime
from typing import Optional, List, Dict, Any

import httpx
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import SystemSetting
from ..printer_engine import (
    detect_local_printer,
    list_printers as _engine_list_printers,
    send_raw as _engine_send_raw,
)

router = APIRouter(prefix="/print", tags=["print"])

STATIONS_SETTING_KEY = "print_stations"

def _get_dynamic_config(db: Session) -> Dict[str, Any]:
    """Combina la config en memoria con los valores dinamicos de la base de datos."""
    try:
        db_settings = db.query(SystemSetting).all()
        settings_dict = {s.key: s.value for s in db_settings}
    except Exception as e:
        print(f"[print_receipt] Error obteniendo configuraciones: {e}")
        settings_dict = {}

    cfg = _print_config.copy()
    if "currency_symbol" in settings_dict:
        cfg["currency_symbol"] = settings_dict["currency_symbol"]
    if "unit_measure" in settings_dict:
        cfg["unit_measure"] = settings_dict["unit_measure"]

    # Construir direccion (Ubicacion: Departamento, Canton, Ciudad, Pais)
    addr_parts = []
    for field in ["station_department", "station_canton", "station_city", "station_country"]:
        val = settings_dict.get(field, "").strip()
        if val:
            addr_parts.append(val)
    if addr_parts:
        cfg["station_address"] = ", ".join(addr_parts)

    return cfg

# ─── Config en memoria ────────────────────────────────────────────────────────

_print_config: Dict[str, Any] = {
    "printer_name":          "Printer_POS-80",
    "station_name":          "GASNOVA OUTLET",
    "station_ruc":           "20459871402",
    "station_address":       "",
    "station_phone":         "",
    "paper_width_chars":     42,
    "ticket_footer_1":       "Gracias por su preferencia!",
    "ticket_footer_2":       "Conserve su comprobante",
    "invoice_footer_1":      "Gracias por su preferencia!",
    "invoice_footer_2":      "Documento tributario electronico",
    "closure_footer_1":      "Cierre de Turno verificado",
    "closure_footer_2":      "GasNova POS v2",
    "feed_lines_before_cut": 4,
    "cut_type":              "full",     # "full" | "partial"
    "show_tax_detail":       False,
    "tax_rate":              0.0,
    "currency_symbol":       "$",
}


# ─── ESC/POS byte constants ───────────────────────────────────────────────────

ESC = b'\x1b'
GS  = b'\x1d'

INIT        = ESC + b'@'             # Reset impresora
ALIGN_LEFT  = ESC + b'a\x00'        # Alinear izquierda
ALIGN_CTR   = ESC + b'a\x01'        # Alinear centro
ALIGN_RIGHT = ESC + b'a\x02'        # Alinear derecha
BOLD_ON     = ESC + b'E\x01'        # Negrita activada
BOLD_OFF    = ESC + b'E\x00'        # Negrita desactivada
DOUBLE_H    = ESC + b'!\x10'        # Doble alto
NORMAL_SIZE = ESC + b'!\x00'        # Tamanho normal
LF          = b'\n'                  # Nueva linea
CUT_FULL    = GS  + b'V\x00'        # Corte total
CUT_PARTIAL = GS  + b'V\x01'        # Corte parcial
FEED_N      = lambda n: ESC + b'd' + bytes([n])   # Avanzar N lineas


def _codepage_cp850() -> bytes:
    """Seleccionar codepage CP850 (soporta caracteres espanoles/europeos)."""
    # ESC t n  donde n=2 es PC850 Multilingual
    return ESC + b't\x02'


# ─── Schemas ──────────────────────────────────────────────────────────────────

class PrintReceiptRequest(BaseModel):
    doc_type:     str
    doc_number:   str
    station_name: Optional[str] = None
    station_ruc:  Optional[str] = None
    shift_id:     Optional[str] = None
    pump_name:    str
    fuel_type:    str
    volume_gal:   float
    unit_price:   float
    total_amount: float
    payment_type: str
    cashier_name: Optional[str] = None
    client_name:  Optional[str] = None
    client_ruc:   Optional[str] = None
    date_time:    Optional[str] = None
    print_station_id: Optional[str] = None  # a qué POS/estación imprimir (ver /print/stations)


class PrintClosureRequest(BaseModel):
    shift_id:          str
    shift_name:        Optional[str] = None
    operator_name:     str
    start_time:        str
    end_time:          str
    total_sales:       float
    total_volume:      float
    transaction_count: int
    fuel_breakdown:    Optional[List[Dict[str, Any]]] = None
    payment_breakdown: Optional[List[Dict[str, Any]]] = None
    counter_breakdown: Optional[List[Dict[str, Any]]] = None
    station_name:      Optional[str] = None
    station_ruc:       Optional[str] = None
    print_station_id:  Optional[str] = None


class PrintNextShiftRequest(BaseModel):
    shift_id:            str
    shift_name:          Optional[str] = None
    previous_shift_id:   Optional[str] = None
    previous_shift_name: Optional[str] = None
    operator_name:       str
    start_time:          str
    station_name:        Optional[str] = None
    station_ruc:          Optional[str] = None
    print_station_id:    Optional[str] = None


class PrintConfigUpdate(BaseModel):
    printer_name:          Optional[str]  = None
    station_name:          Optional[str]  = None
    station_ruc:           Optional[str]  = None
    station_address:       Optional[str]  = None
    station_phone:         Optional[str]  = None
    paper_width_chars:     Optional[int]  = None
    ticket_footer_1:       Optional[str]  = None
    ticket_footer_2:       Optional[str]  = None
    invoice_footer_1:      Optional[str]  = None
    invoice_footer_2:      Optional[str]  = None
    closure_footer_1:      Optional[str]  = None
    closure_footer_2:      Optional[str]  = None
    feed_lines_before_cut: Optional[int]  = None
    cut_type:              Optional[str]  = None
    show_tax_detail:       Optional[bool] = None
    tax_rate:              Optional[float]= None
    currency_symbol:       Optional[str]  = None


# ─── Text helpers ─────────────────────────────────────────────────────────────

_REPLACE_MAP = str.maketrans({
    '\u2019': "'", '\u2018': "'", '\u201c': '"', '\u201d': '"',
    '\u2013': '-', '\u2014': '-', '\u2026': '...',
    '\u26fd': '',  '\u00b0': '.',
    # Caracteres problemáticos en algunos codepages
    '¡': '!', '¿': '?',
    '₡': '¢',  # Colones a centavo/colón de CP850
})


def _safe(text: str) -> str:
    """Texto seguro para CP850: transliterar, luego codificar."""
    text = text.translate(_REPLACE_MAP)
    return text.encode('cp850', errors='replace').decode('cp850')


def _fuel_label(fuel_type: str) -> str:
    return {
        "Regular Unleaded": "Gasolina Regular 87",
        "Premium Unleaded": "Gasolina Super Premium 93",
        "Diesel":           "Diesel B5",
        "Kerosene":         "Queroseno",
    }.get(fuel_type, fuel_type)


def _enc(text: str) -> bytes:
    """Codificar string a CP850 bytes para ESC/POS."""
    return _safe(text).encode('cp850', errors='replace')


def _lr_bytes(left: str, right: str, W: int) -> bytes:
    """Linea izquierda-derecha en ancho W."""
    l = _safe(left)
    r = _safe(right)
    gap = max(1, W - len(l) - len(r))
    return (l + ' ' * gap + r).encode('cp850', errors='replace') + LF


def _div(char: str = '-', W: int = 42) -> bytes:
    return (char * W).encode('cp850') + LF


# ─── ESC/POS binary receipt builder ──────────────────────────────────────────

def _build_receipt_bytes(req: PrintReceiptRequest, cfg: Dict[str, Any] = _print_config) -> bytes:
    W   = cfg["paper_width_chars"]
    cur = cfg["currency_symbol"]

    station_name = req.station_name or cfg["station_name"]
    station_ruc  = req.station_ruc  or cfg["station_ruc"]
    now = req.date_time or datetime.now().strftime("%d/%m/%Y %H:%M:%S")

    fuel_label = _fuel_label(req.fuel_type)
    tax_rate   = cfg["tax_rate"]
    show_tax   = cfg["show_tax_detail"] and req.doc_type in ("factura", "invoice") and tax_rate > 0
    subtotal   = req.volume_gal * req.unit_price
    tax_amount = subtotal * tax_rate if show_tax else 0.0

    doc_label = "FACTURA ELECTRÓNICA" if req.doc_type in ("factura", "invoice") else "BOLETA DE VENTA"
    footer1   = cfg["invoice_footer_1"] if req.doc_type in ("factura", "invoice") else cfg["ticket_footer_1"]
    footer2   = cfg["invoice_footer_2"] if req.doc_type in ("factura", "invoice") else cfg["ticket_footer_2"]
    feed_n    = cfg["feed_lines_before_cut"]
    cut_cmd   = CUT_FULL if cfg["cut_type"] == "full" else CUT_PARTIAL

    if req.doc_type in ("factura", "invoice"):
        buf = bytearray()
        buf += b'\x00' * 150
        buf += LF * 2
        buf += _codepage_cp850()

        # Header (centrado via ESC/POS)
        buf += ALIGN_CTR
        buf += BOLD_ON
        buf += _enc(station_name) + LF
        buf += BOLD_OFF
        buf += _enc(f"R.U.C. {station_ruc} • ESTACIÓN CENTRAL") + LF
        if cfg.get("station_address"):
            buf += _enc(cfg["station_address"]) + LF
        buf += _div('-', W)

        # Documento
        buf += ALIGN_LEFT
        buf += _enc("DOCUMENTO: FACTURA ELECTRÓNICA") + LF
        buf += _enc(f"NÚMERO: {req.doc_number}") + LF
        buf += _enc(f"SURTIDOR: {req.pump_name.upper()} • ISLA 1") + LF
        buf += _div('-', W)

        # Cliente
        if req.client_name:
            buf += _enc(f"CLIENTE: {_safe(req.client_name).upper()}") + LF
        if req.client_ruc:
            buf += _enc(f"R.U.C.: {req.client_ruc}") + LF
        buf += _div('-', W)

        # Detalle
        buf += _enc(f"PRODUCTO: {_safe(fuel_label)}") + LF
        
        unit_measure = cfg.get("unit_measure", "Galones")
        unit_suffix = "Lts" if unit_measure == "Litros" else "Gls"
        
        buf += _enc(f"VOLUMEN: {req.volume_gal:.2f} {unit_suffix}") + LF
        buf += LF
        buf += ALIGN_RIGHT
        buf += BOLD_ON
        buf += _enc(f"COD. TOTAL: {cur}{req.total_amount:.2f}") + LF
        buf += BOLD_OFF
        buf += ALIGN_LEFT
        buf += _div('-', W)

        # Footer (centrado)
        buf += ALIGN_CTR
        buf += _enc("Representación impresa autorizada de comprobante") + LF
        buf += _enc("electrónico.") + LF
        buf += LF
        buf += BOLD_ON
        buf += _enc("¡Gracias por su preferencia!") + LF
        buf += BOLD_OFF

        buf += FEED_N(feed_n)
        buf += cut_cmd
        return bytes(buf)

    buf = bytearray()
    buf += b'\x00' * 150
    buf += LF * 2
    # Omit INIT (ESC @) to avoid dropping early print characters on PR-255/POS-80
    buf += _codepage_cp850()

    # ── Header (centrado via ESC/POS) ────────────────────────────────────────
    buf += ALIGN_CTR
    buf += _div('=', W)
    buf += BOLD_ON
    buf += _enc(station_name) + LF
    buf += BOLD_OFF
    buf += _enc(f"R.U.C. {station_ruc}") + LF
    buf += _enc("ESTACION DE SERVICIO") + LF
    if cfg.get("station_address"):
        buf += _enc(cfg["station_address"]) + LF
    if cfg.get("station_phone"):
        buf += _enc(f"Tel: {cfg['station_phone']}") + LF
    buf += _div('=', W)

    # ── Documento ────────────────────────────────────────────────────────────
    buf += BOLD_ON
    buf += _enc(doc_label) + LF
    buf += BOLD_OFF
    buf += _enc(f"No. {req.doc_number}") + LF
    buf += ALIGN_LEFT
    buf += _div('-', W)

    # ── Metadatos ────────────────────────────────────────────────────────────
    buf += _lr_bytes("FECHA:", now, W)
    buf += _lr_bytes("SURTIDOR:", req.pump_name, W)
    if req.shift_id:
        buf += _lr_bytes("TURNO:", req.shift_id, W)
    if req.cashier_name:
        buf += _lr_bytes("CAJERO:", _safe(req.cashier_name), W)
    buf += _div('-', W)

    # ── Cliente (solo factura) ───────────────────────────────────────────────
    if req.doc_type == "factura" and req.client_name:
        buf += _enc("CLIENTE:") + LF
        buf += _enc(f"  {_safe(req.client_name)[:W-2]}") + LF
        if req.client_ruc:
            buf += _lr_bytes("  RUC:", req.client_ruc, W)
        buf += _div('-', W)

    # ── Detalle ──────────────────────────────────────────────────────────────
    buf += _enc("PRODUCTO:") + LF
    buf += _enc(f"  {_safe(fuel_label)}") + LF
    buf += _div('-', W)

    unit_measure = cfg.get("unit_measure", "Galones")
    if unit_measure == "Litros":
        vol_label = "LITROS:"
        price_label = "PRECIO/LT:"
        unit_suffix = "Lt"
    else:
        vol_label = "GALONES:"
        price_label = "PRECIO/GAL:"
        unit_suffix = "Gal"

    buf += _lr_bytes(vol_label, f"{req.volume_gal:.3f} {unit_suffix}", W)
    buf += _lr_bytes(price_label, f"{cur}{req.unit_price:.3f}", W)
    buf += _div('-', W)

    # ── Totales ──────────────────────────────────────────────────────────────
    if show_tax:
        buf += _lr_bytes("SUBTOTAL:", f"{cur}{subtotal:.2f}", W)
        buf += _lr_bytes(f"IVA ({int(tax_rate*100)}%):", f"{cur}{tax_amount:.2f}", W)
        buf += _div('-', W)

    buf += BOLD_ON
    buf += _lr_bytes("TOTAL:", f"{cur}{req.total_amount:.2f}", W)
    buf += BOLD_OFF
    buf += _lr_bytes("FORMA PAGO:", _safe(req.payment_type), W)
    buf += _div('=', W)

    # ── Footer (centrado) ────────────────────────────────────────────────────
    buf += ALIGN_CTR
    buf += _enc(_safe(footer1)) + LF
    buf += _enc(_safe(footer2)) + LF
    buf += _div('-', W)

    # ── Avance y corte ───────────────────────────────────────────────────────
    buf += FEED_N(feed_n)
    buf += cut_cmd

    return bytes(buf)


def _build_closure_bytes(req: PrintClosureRequest, cfg: Dict[str, Any] = _print_config) -> bytes:
    W   = cfg["paper_width_chars"]
    cur = cfg["currency_symbol"]

    station_name = req.station_name or cfg["station_name"]
    station_ruc  = req.station_ruc  or cfg["station_ruc"]
    feed_n   = cfg["feed_lines_before_cut"]
    cut_cmd  = CUT_FULL if cfg["cut_type"] == "full" else CUT_PARTIAL
    now      = datetime.now().strftime("%d/%m/%Y %H:%M:%S")

    buf = bytearray()
    buf += b'\x00' * 150
    buf += LF * 2
    buf += _codepage_cp850()

    buf += ALIGN_CTR
    buf += _div('=', W)
    buf += BOLD_ON
    buf += _enc(station_name) + LF
    buf += BOLD_OFF
    buf += _enc(f"R.U.C. {station_ruc}") + LF
    buf += _div('=', W)
    buf += BOLD_ON
    buf += _enc("*** CIERRE DE TURNO ***") + LF
    buf += BOLD_OFF
    
    shift_display = req.shift_name if req.shift_name else req.shift_id
    buf += _enc(f"Turno: {shift_display}") + LF
    buf += ALIGN_LEFT
    buf += _div('-', W)

    buf += _lr_bytes("CAJERO:", _safe(req.operator_name), W)
    buf += _lr_bytes("INICIO:", _safe(req.start_time), W)
    buf += _lr_bytes("CIERRE:", _safe(req.end_time), W)
    buf += _lr_bytes("IMPRESION:", now, W)
    buf += _div('-', W)

    buf += ALIGN_CTR
    buf += _enc("RESUMEN DE VENTAS") + LF
    buf += ALIGN_LEFT
    buf += _div('-', W)
    unit_measure = cfg.get("unit_measure", "Galones")
    if unit_measure == "Litros":
        total_vol_label = "TOTAL LITROS:"
        vol_breakdown_label = "    Litros:"
        unit_suffix = "Lt"
    else:
        total_vol_label = "TOTAL GALONES:"
        vol_breakdown_label = "    Galones:"
        unit_suffix = "Gal"

    buf += _lr_bytes("TOTAL TRANSACCIONES:", str(req.transaction_count), W)
    buf += _lr_bytes(total_vol_label, f"{req.total_volume:.3f} {unit_suffix}", W)
    buf += BOLD_ON
    buf += _lr_bytes("TOTAL VENTAS:", f"{cur}{req.total_sales:.2f}", W)
    buf += BOLD_OFF
    buf += _div('-', W)

    if req.fuel_breakdown:
        buf += ALIGN_CTR
        buf += _enc("POR COMBUSTIBLE") + LF
        buf += ALIGN_LEFT
        buf += _div('-', W)
        for fb in req.fuel_breakdown:
            label = _fuel_label(fb.get("fuel_type", ""))
            vol   = fb.get("volume", 0.0)
            amt   = fb.get("amount", 0.0)
            buf += _enc(f"  {_safe(label[:W-2])}") + LF
            buf += _lr_bytes(vol_breakdown_label, f"{vol:.3f} {unit_suffix}", W)
            buf += _lr_bytes("    Monto:", f"{cur}{amt:.2f}", W)
        buf += _div('-', W)

    if req.payment_breakdown:
        buf += ALIGN_CTR
        buf += _enc("POR FORMA DE PAGO") + LF
        buf += ALIGN_LEFT
        buf += _div('-', W)
        for pb in req.payment_breakdown:
            method = _safe(pb.get("method", ""))
            amt    = pb.get("amount", 0.0)
            buf += _lr_bytes(f"  {method}:", f"{cur}{amt:.2f}", W)
        buf += _div('-', W)

    if req.counter_breakdown:
        unit_measure = cfg.get("unit_measure", "Galones")
        unit_suffix = "Lt" if unit_measure == "Litros" else "Gal"
        buf += ALIGN_CTR
        buf += _enc("CONTADORES POR CARA") + LF
        buf += ALIGN_LEFT
        buf += _div('-', W)
        for cb in req.counter_breakdown:
            name         = _safe(cb.get("pump_name", f"Cara {cb.get('pump_id', '?')}"))
            sys_vol      = cb.get("system_volume", 0.0)
            mech_vol     = cb.get("mech_volume", 0.0)
            diff         = mech_vol - sys_vol
            diff_str     = f"{'+' if diff >= 0 else ''}{diff:.2f} {unit_suffix}"
            buf += _enc(f"  {name[:W-2]}") + LF
            buf += _lr_bytes("    Sistema:", f"{sys_vol:.2f} {unit_suffix}", W)
            buf += _lr_bytes("    Mecanico:", f"{mech_vol:.2f} {unit_suffix}", W)
            buf += _lr_bytes("    Diferencia:", diff_str, W)
        buf += _div('-', W)

    buf += _div('=', W)
    buf += ALIGN_CTR
    buf += _enc(_safe(cfg["closure_footer_1"])) + LF
    buf += _enc(_safe(cfg["closure_footer_2"])) + LF
    buf += _div('-', W)

    # Líneas de firma
    line = "_" * max(W - 24, 16)
    buf += LF
    buf += ALIGN_LEFT
    buf += _enc(f"Operador Saliente: {line}") + LF
    buf += LF
    buf += _enc(f"Supervisor POS:    {line}") + LF
    buf += _div('-', W)

    buf += FEED_N(feed_n)
    buf += cut_cmd

    return bytes(buf)


def _build_next_shift_bytes(req: PrintNextShiftRequest, cfg: Dict[str, Any] = _print_config) -> bytes:
    W   = cfg["paper_width_chars"]
    
    station_name = req.station_name or cfg["station_name"]
    station_ruc  = req.station_ruc  or cfg["station_ruc"]
    feed_n   = cfg["feed_lines_before_cut"]
    cut_cmd  = CUT_FULL if cfg["cut_type"] == "full" else CUT_PARTIAL
    now      = datetime.now().strftime("%d/%m/%Y %H:%M:%S")

    buf = bytearray()
    buf += b'\x00' * 150
    buf += LF * 2
    buf += _codepage_cp850()

    buf += ALIGN_CTR
    buf += _div('=', W)
    buf += BOLD_ON
    buf += _enc(station_name) + LF
    buf += BOLD_OFF
    buf += _enc(f"R.U.C. {station_ruc}") + LF
    buf += _div('=', W)
    buf += BOLD_ON
    buf += _enc("*** INICIAR SIGUIENTE TURNO ***") + LF
    buf += BOLD_OFF
    buf += _div('-', W)

    buf += ALIGN_LEFT
    if req.previous_shift_id:
        prev_display = req.previous_shift_name if req.previous_shift_name else req.previous_shift_id
        buf += _lr_bytes("TURNO SALIENTE:", _safe(prev_display), W)
    
    curr_display = req.shift_name if req.shift_name else req.shift_id
    buf += _lr_bytes("TURNO ENTRANTE:", _safe(curr_display), W)
    buf += _lr_bytes("OPERADOR REG.:", _safe(req.operator_name), W)
    buf += _lr_bytes("HORA APERTURA:", _safe(req.start_time), W)
    buf += _lr_bytes("IMPRESION:", now, W)
    buf += _div('-', W)

    buf += ALIGN_CTR
    buf += _enc("Por favor verificar lecturas") + LF
    buf += _enc("de odometros antes de iniciar.") + LF
    buf += _div('-', W)
    buf += LF * 2
    buf += _enc("___________________________") + LF
    buf += _enc("Firma Operador Recibido") + LF
    buf += _div('=', W)

    buf += FEED_N(feed_n)
    buf += cut_cmd

    return bytes(buf)


def _build_test_bytes() -> bytes:
    cfg = _print_config
    W   = cfg["paper_width_chars"]
    now = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
    feed_n  = cfg["feed_lines_before_cut"]
    cut_cmd = CUT_FULL if cfg["cut_type"] == "full" else CUT_PARTIAL

    buf = bytearray()
    buf += b'\x00' * 150
    buf += LF * 2
    buf += _codepage_cp850()

    buf += ALIGN_CTR
    buf += _div('=', W)
    buf += BOLD_ON
    buf += _enc("PAGINA DE PRUEBA") + LF
    buf += BOLD_OFF
    buf += _enc(cfg["station_name"]) + LF
    buf += _enc(now) + LF
    buf += _div('=', W)
    buf += _enc("Tildes: a e i o u") + LF
    buf += _enc("Vocales: A E I O U N U") + LF
    buf += _enc("Num: 0123456789 $.,:/") + LF
    buf += _div('-', W)
    buf += _enc("Alineacion CENTRO (esta linea)") + LF
    buf += ALIGN_LEFT
    buf += _enc("Alineacion IZQUIERDA") + LF
    buf += ALIGN_RIGHT
    buf += _enc("Alineacion DERECHA") + LF
    buf += ALIGN_CTR
    buf += _div('-', W)
    buf += _enc("Impresora OK - Corte a continuacion") + LF
    buf += FEED_N(feed_n)
    buf += cut_cmd

    return bytes(buf)


# ─── Impresión: local, red o agente remoto ────────────────────────────────────
# Ver backend/pts2_api/printer_engine.py para list_printers/send_raw compartidos
# con el agente standalone (backend/print_agent/agent.py).

def _list_printers() -> List[str]:
    return _engine_list_printers()


def _detect_printer() -> Optional[str]:
    """Retorna la impresora local configurada globalmente (comportamiento legado,
    usado cuando una petición no especifica station_id — instalaciones de un solo POS)."""
    return detect_local_printer(_print_config.get("printer_name", ""))


class Station(BaseModel):
    id:     str
    name:   str
    mode:   str  # "local" | "network" | "agent"
    target: str = ""  # nombre de impresora local, "ip:port" de red, o URL base del agente


def _get_stations(db: Session) -> List[Dict[str, Any]]:
    row = db.query(SystemSetting).filter(SystemSetting.key == STATIONS_SETTING_KEY).first()
    if not row or not row.value:
        return []
    try:
        return json.loads(row.value)
    except Exception:
        return []


def _save_stations(db: Session, stations: List[Dict[str, Any]]) -> None:
    row = db.query(SystemSetting).filter(SystemSetting.key == STATIONS_SETTING_KEY).first()
    value = json.dumps(stations)
    if row:
        row.value = value
    else:
        row = SystemSetting(key=STATIONS_SETTING_KEY, value=value)
        db.add(row)
    db.commit()


def _find_station(db: Session, station_id: str) -> Optional[Dict[str, Any]]:
    for s in _get_stations(db):
        if s.get("id") == station_id:
            return s
    return None


def _send_via_agent(agent_url: str, data: bytes) -> tuple[bool, str]:
    """Reenvía los bytes ESC/POS al agente de impresión local de otra PC."""
    url = agent_url.rstrip("/") + "/print-raw"
    try:
        payload = {"data_b64": base64.b64encode(data).decode("ascii")}
        resp = httpx.post(url, json=payload, timeout=15.0)
        if resp.status_code == 200:
            body = resp.json()
            return True, body.get("message", "Impreso vía agente remoto")
        return False, f"Agente respondió {resp.status_code}: {resp.text}"
    except Exception as e:
        return False, f"No se pudo contactar al agente en {agent_url}: {str(e)}"


def _resolve_and_send(data: bytes, db: Session, station_id: Optional[str]) -> tuple[bool, str, str]:
    """Envía los bytes a la impresora que corresponda según la estación.

    Retorna (ok, mensaje, descripcion_destino).
    - Sin station_id: comportamiento legado, impresora local única del servidor.
    - mode="local"/"network": envío directo (misma lógica que antes, vía printer_engine).
    - mode="agent": reenvía por HTTP al agente instalado en la PC de esa estación.
    """
    if not station_id:
        printer = _detect_printer()
        if not printer:
            return False, "No hay impresora disponible.", ""
        ok, msg = _engine_send_raw(data, printer)
        return ok, msg, printer

    station = _find_station(db, station_id)
    if not station:
        return False, f"Estación '{station_id}' no está configurada en Ajustes.", ""

    mode = station.get("mode", "local")
    target = station.get("target", "")

    if mode == "agent":
        if not target:
            return False, f"Estación '{station_id}' no tiene URL de agente configurada.", ""
        ok, msg = _send_via_agent(target, data)
        return ok, msg, f"agente:{target}"

    # mode == "local" o "network": mismo mecanismo, printer_engine detecta cuál es
    printer = target or _detect_printer()
    if not printer:
        return False, f"Estación '{station_id}' no tiene impresora disponible.", ""
    ok, msg = _engine_send_raw(data, printer)
    return ok, msg, printer


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/receipt")
async def print_receipt(req: PrintReceiptRequest, db: Session = Depends(get_db)):
    """Imprime un ticket/factura usando ESC/POS binario puro con corte automatico.

    Si `print_station_id` viene informado, se envía a la impresora de esa
    estación (local, red o agente remoto según /print/stations). Sin
    `print_station_id`, usa la impresora local única configurada globalmente
    (comportamiento legado para instalaciones de un solo POS).
    """
    cfg = _get_dynamic_config(db)
    data = _build_receipt_bytes(req, cfg)
    ok, msg, target = _resolve_and_send(data, db, req.print_station_id)

    if not ok:
        raise HTTPException(status_code=500, detail=f"Error de impresion: {msg}")

    return {
        "ok": True,
        "printer": target,
        "doc_number": req.doc_number,
        "bytes_sent": len(data),
        "message": f"Comprobante {req.doc_number} enviado a {target}"
    }


@router.post("/closure")
async def print_closure(req: PrintClosureRequest, db: Session = Depends(get_db)):
    """Imprime el reporte de cierre de turno con corte automatico."""
    cfg = _get_dynamic_config(db)
    data = _build_closure_bytes(req, cfg)
    ok, msg, target = _resolve_and_send(data, db, req.print_station_id)

    if not ok:
        raise HTTPException(status_code=500, detail=f"Error de impresion: {msg}")

    return {
        "ok": True,
        "printer": target,
        "shift_id": req.shift_id,
        "bytes_sent": len(data),
        "message": f"Cierre {req.shift_id} impreso en {target}"
    }


@router.post("/next-shift")
async def print_next_shift(req: PrintNextShiftRequest, db: Session = Depends(get_db)):
    """Imprime el ticket de apertura del siguiente turno."""
    cfg = _get_dynamic_config(db)
    data = _build_next_shift_bytes(req, cfg)
    ok, msg, target = _resolve_and_send(data, db, req.print_station_id)

    if not ok:
        raise HTTPException(status_code=500, detail=f"Error de impresion: {msg}")

    return {
        "ok": True,
        "printer": target,
        "shift_id": req.shift_id,
        "bytes_sent": len(data),
        "message": f"Turno {req.shift_id} impreso en {target}"
    }


@router.post("/test")
async def print_test(print_station_id: Optional[str] = None, db: Session = Depends(get_db)):
    """Imprime pagina de prueba con verificacion de alineacion y corte."""
    data = _build_test_bytes()
    ok, msg, target = _resolve_and_send(data, db, print_station_id)

    return {
        "ok": ok,
        "printer": target,
        "bytes_sent": len(data),
        "message": msg or ("Prueba enviada" if ok else "Error al imprimir")
    }


# ─── Estaciones de impresión (multi-POS) ───────────────────────────────────────

@router.get("/stations")
async def get_print_stations(db: Session = Depends(get_db)):
    """Lista las estaciones/POS configuradas y su destino de impresión."""
    return {"stations": _get_stations(db)}


@router.put("/stations")
async def update_print_stations(stations: List[Station], db: Session = Depends(get_db)):
    """Reemplaza la lista completa de estaciones de impresión.

    mode:
      - "local":   impresora USB/local conectada a esta misma PC (servidor).
      - "network": impresora térmica con IP propia (Ethernet/WiFi), target="ip:puerto".
      - "agent":   PC remota con impresora USB corriendo el print_agent,
                   target="http://IP_DE_ESA_PC:9200".
    """
    ids = [s.id for s in stations]
    if len(ids) != len(set(ids)):
        raise HTTPException(status_code=400, detail="Los IDs de estación deben ser únicos.")
    data = [s.model_dump() for s in stations]
    _save_stations(db, data)
    return {"ok": True, "stations": data}


@router.post("/stations/{station_id}/test")
async def test_print_station(station_id: str, db: Session = Depends(get_db)):
    """Imprime una página de prueba en la impresora de una estación específica."""
    data = _build_test_bytes()
    ok, msg, target = _resolve_and_send(data, db, station_id)
    return {
        "ok": ok,
        "printer": target,
        "bytes_sent": len(data),
        "message": msg or ("Prueba enviada" if ok else "Error al imprimir")
    }


@router.get("/status")
async def printer_status():
    """Estado de la impresora activa y lista de todas las impresoras del sistema."""
    all_printers = _list_printers()
    active = _detect_printer()

    # Si la impresora activa parece de red y no está en la lista de locales, agregarla para reportar estado
    if active and active not in all_printers:
        import re
        target = active.strip()
        if target.lower().startswith("tcp://") or ":" in target or re.match(r'^(\d{1,3}\.){3}\d{1,3}$', target):
            all_printers.append(active)

    statuses: Dict[str, Any] = {}
    import platform
    is_windows = platform.system() == 'Windows'
    for pname in all_printers:
        # Detectar si es impresora de red
        is_net = False
        net_host = ""
        net_port = 9100
        target = pname.strip()
        if target.lower().startswith("tcp://"):
            target = target[6:]
            is_net = True
        if ":" in target:
            parts = target.split(":")
            if len(parts) == 2 and parts[1].isdigit():
                net_host = parts[0]
                net_port = int(parts[1])
                is_net = True
        elif not is_net:
            import re
            if re.match(r'^(\d{1,3}\.){3}\d{1,3}$', target):
                net_host = target
                is_net = True

        if is_net:
            if not net_host:
                net_host = target
            import socket
            try:
                # Intento rápido de conexión
                with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                    s.settimeout(1.0)
                    s.connect((net_host, net_port))
                statuses[pname] = {
                    "available": True,
                    "info": f"Impresora de red TCP online en {net_host}:{net_port}",
                    "is_active": pname == active,
                }
            except Exception as e:
                statuses[pname] = {
                    "available": False,
                    "info": f"Impresora de red TCP offline en {net_host}:{net_port}: {str(e)}",
                    "is_active": pname == active,
                }
        elif is_windows:
            statuses[pname] = {
                "available": True,
                "info": "Impresora Windows activa / lista en el sistema",
                "is_active": pname == active,
            }
        else:
            try:
                result = subprocess.run(
                    ["lpstat", "-p", pname], capture_output=True, text=True
                )
                statuses[pname] = {
                    "available": result.returncode == 0,
                    "info": result.stdout.strip() or result.stderr.strip(),
                    "is_active": pname == active,
                }
            except Exception as e:
                statuses[pname] = {
                    "available": False,
                    "info": f"Error consultando estado en Unix: {str(e)}",
                    "is_active": pname == active,
                }

    return {
        "active_printer": active,
        "configured_printer": _print_config.get("printer_name"),
        "printers": statuses,
        "all_printer_names": all_printers,
    }


@router.get("/config")
async def get_print_config():
    return _print_config


@router.put("/config")
async def update_print_config(update: PrintConfigUpdate):
    data = update.model_dump(exclude_none=True)
    _print_config.update(data)
    return {"ok": True, "config": _print_config}


@router.get("/download-bat")
async def download_bat():
    """Descarga el script run_backend.bat para Windows."""
    from fastapi.responses import FileResponse
    current_dir = os.path.dirname(os.path.abspath(__file__))
    # El archivo está en backend/run_backend.bat, subiendo un nivel desde pts2_api/routers a backend
    bat_path = os.path.abspath(os.path.join(current_dir, "..", "..", "run_backend.bat"))
    if os.path.exists(bat_path):
        return FileResponse(bat_path, media_type='application/octet-stream', filename='run_backend.bat')
    raise HTTPException(status_code=404, detail="Script run_backend.bat no encontrado.")
