"""SQLAlchemy ORM models for GasNova database."""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Index
from sqlalchemy.sql import func

from .database import Base


class PumpTransaction(Base):
    """Registro de transacciones de bombas."""

    __tablename__ = "pump_transactions"

    id = Column(Integer, primary_key=True, index=True)
    pump_id = Column(Integer, nullable=False, index=True)
    transaction_id = Column(Integer, nullable=False)
    nozzle = Column(Integer, nullable=True)
    volume = Column(Float, nullable=True, comment="Volumen en litros")
    amount = Column(Float, nullable=True, comment="Monto en moneda local")
    unit_price = Column(Float, nullable=True, comment="Precio por unidad")
    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)
    status = Column(String(50), nullable=True, comment="Estado: completed, cancelled, etc")
    shift_id = Column(String(50), nullable=True, index=True)
    payment_type = Column(String(50), nullable=True)
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
    pin = Column(String(10), nullable=False)
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
