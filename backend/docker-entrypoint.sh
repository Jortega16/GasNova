#!/bin/sh
# Prepara la base de datos antes de arrancar la API:
#   1. Espera a que PostgreSQL esté listo para aceptar conexiones.
#   2. Si es una base de datos nueva (sin tablas), las crea directamente con
#      el esquema actual y marca el historial de Alembic como al día.
#   3. Si ya existe (instalación previa), aplica las migraciones pendientes.
#      Las migraciones son idempotentes: verifican el estado real de cada
#      columna/índice antes de tocarlo, así que son seguras de correr sin
#      importar en qué punto exacto quedó esa base de datos.
set -e

echo "[entrypoint] Esperando a que la base de datos esté disponible..."
python -c "
import sys, time
from sqlalchemy import create_engine
from pts2_api.database import DATABASE_URL

engine = create_engine(DATABASE_URL)
for attempt in range(30):
    try:
        with engine.connect():
            print('[entrypoint] Base de datos disponible.')
            sys.exit(0)
    except Exception as exc:
        if attempt == 29:
            print(f'[entrypoint] No se pudo conectar a la base de datos: {exc}')
            sys.exit(1)
        time.sleep(1)
"

STATE=$(python -c "
from sqlalchemy import create_engine, inspect
from pts2_api.database import DATABASE_URL

engine = create_engine(DATABASE_URL)
tables = inspect(engine).get_table_names()
if not tables:
    print('fresh')
elif 'alembic_version' not in tables:
    print('legacy')
else:
    print('tracked')
")

case "$STATE" in
    fresh)
        echo "[entrypoint] Base de datos nueva — creando esquema actual y marcando Alembic al día..."
        python -c "from pts2_api.database import init_db; init_db()"
        alembic stamp head
        ;;
    legacy)
        echo "[entrypoint] Base de datos existente sin historial de Alembic — aplicando migraciones (idempotentes)..."
        alembic stamp base
        alembic upgrade head
        ;;
    tracked)
        echo "[entrypoint] Aplicando migraciones pendientes de Alembic..."
        alembic upgrade head
        ;;
esac

echo "[entrypoint] Listo. Iniciando aplicación..."
exec "$@"
