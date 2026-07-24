"""SQLAlchemy ORM models for GasNova database."""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Index, JSON
from sqlalchemy.sql import func

from .database import Base


class PumpTransaction(Base):
    """Registro de transacciones de bombas."""

    __tablename__ = "pump_transactions"

    id = Column(Integer, primary_key=True, index=True)
    pump_id = Column(Integer, nullable=False, index=True)
    transaction_id = Column(Integer, nullable=False)
    nozzle = Column(Integer, nullable=True)
    fuel_type = Column(String(50), nullable=True, index=True, comment="Tipo de combustible: Regular Unleaded, Diesel, etc.")
    volume = Column(Float, nullable=True, comment="Volumen en litros")
    tc_volume = Column(Float, nullable=True, comment="Volumen compensado por temperatura (TCVolume jsonPTS)")
    amount = Column(Float, nullable=True, comment="Monto en moneda local")
    unit_price = Column(Float, nullable=True, comment="Precio por unidad")
    total_volume = Column(Float, nullable=True, comment="Contador total de volumen acumulado en la bomba (TotalVolume jsonPTS)")
    total_amount = Column(Float, nullable=True, comment="Contador total de monto acumulado en la bomba (TotalAmount jsonPTS)")
    flow_rate = Column(Integer, nullable=True, comment="Caudal de despacho en unidades/min (FlowRate jsonPTS)")
    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)
    status = Column(String(50), nullable=True, comment="Estado: completed, cancelled, etc")
    is_paid = Column(Boolean, nullable=True, comment="Transacción cobrada (IsPaid jsonPTS)")
    is_offline = Column(Boolean, nullable=True, comment="Despacho en modo offline/manual (IsOffline jsonPTS)")
    shift_number = Column(Integer, nullable=True, comment="Número de turno del PTS-2 (ShiftNumber jsonPTS)")
    rfid_tag = Column(String(64), nullable=True, comment="Tag RFID usado en la autorización (Tag jsonPTS)")
    pts_user_id = Column(Integer, nullable=True, comment="ID de usuario PTS-2 que autorizó (UserId jsonPTS)")
    sync_source = Column(String(30), nullable=True, index=True, comment="Origen: websocket | sd_recovery | manual")
    shift_id = Column(String(50), nullable=True, index=True)
    payment_type = Column(String(50), nullable=True)
    document_type = Column(String(50), nullable=True)
    document_number = Column(String(100), nullable=True)
    payment_reference = Column(String(100), nullable=True)
    cashier_name = Column(String(100), nullable=True)
    source_pending_trx_id = Column(String(50), nullable=True, index=True)
    station_code = Column(String(50), nullable=True)
    pos_terminal_code = Column(String(50), nullable=True)
    raw_payload = Column(JSON, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    __table_args__ = (Index("idx_pump_transaction", "pump_id", "transaction_id"),)


class TankMeasurement(Base):
    """Registro de mediciones de tanques."""

    __tablename__ = "tank_measurements"

    id = Column(Integer, primary_key=True, index=True)
    tank_id = Column(Integer, nullable=False, index=True)
    probe_id = Column(Integer, nullable=True)
    height = Column(Float, nullable=True, comment="Altura en milímetros")
    volume = Column(Float, nullable=True, comment="Volumen en litros")
    temperature = Column(Float, nullable=True, comment="Temperatura en °C")
    product_code = Column(String(50), nullable=True, comment="Código del producto")
    measurement_time = Column(DateTime, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    __table_args__ = (Index("idx_tank_measurement", "tank_id", "measurement_time"),)


class SystemAlert(Base):
    """Registro de alertas del sistema."""

    __tablename__ = "system_alerts"

    id = Column(Integer, primary_key=True, index=True)
    alert_code = Column(Integer, nullable=False, index=True)
    alert_type = Column(String(50), nullable=False, comment="Tipo: warning, error, critical")
    description = Column(String(500), nullable=True)
    device_id = Column(Integer, nullable=True, comment="ID de dispositivo afectado")
    resolved = Column(Boolean, default=False, nullable=False)
    resolved_at = Column(DateTime, nullable=True)
    alert_time = Column(DateTime, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    __table_args__ = (Index("idx_alert_time", "alert_time"),)


class InTankDelivery(Base):
    """Registro de entregas internas en tanques."""

    __tablename__ = "in_tank_deliveries"

    id = Column(Integer, primary_key=True, index=True)
    tank_id = Column(Integer, nullable=False, index=True)
    delivery_date = Column(DateTime, nullable=False)
    volume = Column(Float, nullable=False, comment="Volumen entregado en litros")
    product_code = Column(String(50), nullable=True)
    driver_name = Column(String(100), nullable=True)
    truck_number = Column(String(50), nullable=True)
    notes = Column(String(500), nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    __table_args__ = (Index("idx_delivery_date", "tank_id", "delivery_date"),)


class PumpConfiguration(Base):
    """Configuración de bombas."""

    __tablename__ = "pump_configuration"

    id = Column(Integer, primary_key=True, index=True)
    pump_id = Column(Integer, unique=True, nullable=False, index=True)
    pump_name = Column(String(100), nullable=True)
    status = Column(String(50), default="active", nullable=False)
    location = Column(String(200), nullable=True)
    nozzles_count = Column(Integer, default=1)
    # Mapeo persistente de mangueras: [{nozzle, fuel_grade_id, fuel_type, name}, ...]
    nozzles_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class TankConfiguration(Base):
    """Configuración de tanques."""

    __tablename__ = "tank_configuration"

    id = Column(Integer, primary_key=True, index=True)
    tank_id = Column(Integer, unique=True, nullable=False, index=True)
    tank_name = Column(String(100), nullable=True)
    product_code = Column(String(50), nullable=True)
    capacity = Column(Float, nullable=True, comment="Capacidad en litros")
    status = Column(String(50), default="active", nullable=False)
    location = Column(String(200), nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class User(Base):
    """Modelo para perfiles de operadores de GasNova."""

    __tablename__ = "users"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    username = Column(String(50), unique=True, nullable=False, index=True)
    role = Column(String(50), nullable=False)
    avatar = Column(String(50), nullable=True)
    pin = Column(String(200), nullable=False)  # salt:hash (pbkdf2_hmac), ver security.hash_pin
    status = Column(String(50), default="Active", nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)


class Shift(Base):
    """Modelo para registro de control de turnos."""

    __tablename__ = "shifts"

    id = Column(Integer, primary_key=True, index=True)
    shift_id = Column(String(50), unique=True, nullable=False, index=True)
    operator_name = Column(String(100), nullable=False)
    start_time = Column(String(100), nullable=True)
    end_time = Column(String(100), nullable=True)
    status = Column(String(50), default="Active", nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)


class DbScheduledPrice(Base):
    """Modelo para programaciones de precios a futuro."""

    __tablename__ = "scheduled_prices"

    id = Column(String(50), primary_key=True, index=True)
    date_time = Column(String(100), nullable=False)
    fuel_type = Column(String(100), nullable=False)
    new_price = Column(Float, nullable=False)
    status = Column(String(50), default="Pending", nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)


class SystemSetting(Base):
    """Modelo para configuraciones de parámetros del sistema."""

    __tablename__ = "system_settings"

    key = Column(String(100), primary_key=True, index=True)
    value = Column(String(500), nullable=False)


class PendingTransaction(Base):
    """Registro de transacciones de manguera pendientes (despachos en cola transitoria)."""

    __tablename__ = "pending_transactions"

    id = Column(Integer, primary_key=True, index=True)
    trx_id = Column(String(50), unique=True, nullable=False, index=True)
    pump_id = Column(Integer, nullable=False, index=True)
    nozzle = Column(Integer, nullable=False)
    volume = Column(Float, nullable=False, comment="Volumen en litros")
    amount = Column(Float, nullable=False, comment="Monto cobrado")
    fuel_type = Column(String(50), nullable=False)
    pts_transaction_id = Column(String(100), nullable=True, index=True)
    raw_payload = Column(JSON, nullable=True)
    shift_id = Column(String(50), nullable=True, index=True)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    status = Column(String(50), default="Pending", nullable=False)
    station_code = Column(String(50), nullable=True)
    pos_terminal_code = Column(String(50), nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)


class ShiftClosure(Base):
    """Resumen congelado del cierre formal de un turno."""

    __tablename__ = "shift_closures"

    id = Column(Integer, primary_key=True, index=True)
    shift_id = Column(String(50), nullable=False, index=True)
    operator_name = Column(String(100), nullable=False)
    opened_at = Column(String(100), nullable=True)
    closed_at = Column(String(100), nullable=True)
    total_sales = Column(Float, default=0.0, nullable=False)
    total_volume = Column(Float, default=0.0, nullable=False)
    transaction_count = Column(Integer, default=0, nullable=False)
    fuel_breakdown = Column(JSON, nullable=True)
    payment_breakdown = Column(JSON, nullable=True)
    pending_count = Column(Integer, default=0, nullable=False)
    closure_status = Column(String(50), default="Closed", nullable=False)
    counter_breakdown = Column(JSON, nullable=True, comment="Contadores mecánicos por cara al momento del cierre")
    created_at = Column(DateTime, server_default=func.now(), nullable=False)


class PumpEventLog(Base):
    """Evento crudo del PTS-2 conservado para auditoría técnica."""

    __tablename__ = "pump_event_logs"

    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String(100), nullable=False, index=True)
    pump_id = Column(Integer, nullable=True, index=True)
    nozzle = Column(Integer, nullable=True)
    pts_transaction_id = Column(String(100), nullable=True, index=True)
    raw_payload = Column(JSON, nullable=True)
    received_at = Column(DateTime, server_default=func.now(), nullable=False)
