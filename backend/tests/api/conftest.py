"""Configuración compartida de los tests de API.

GASNOVA_TESTING=1 hace que el lifespan de la app NO toque la base de datos
real (init_db, seeds y secreto de tokens van contra DATABASE_URL en
producción; en tests cada archivo usa su propio engine SQLite en memoria
inyectado vía dependency_overrides).

GASNOVA_DISABLE_AUTH=1 desactiva el middleware de autenticación para los
tests funcionales; test_auth.py lo reactiva explícitamente por app.state.
"""
import os

os.environ.setdefault("GASNOVA_TESTING", "1")
os.environ.setdefault("GASNOVA_DISABLE_AUTH", "1")
