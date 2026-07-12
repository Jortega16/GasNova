"""Tests del middleware de autenticación por token de sesión."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from pts2_api.database import Base, get_db
from pts2_api import models  # noqa: F401 — registra tablas
from pts2_api.main import create_app
from pts2_api.dependencies import get_pts2_client
from pts2_api.routers.users import seed_initial_users_if_empty
from tests.api.test_api import FakeClient


@pytest.fixture(name="auth_client")
def auth_client_fixture():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    session = TestingSession()
    try:
        seed_initial_users_if_empty(session)
    finally:
        session.close()

    def _get_db():
        db = TestingSession()
        try:
            yield db
        finally:
            db.close()

    app = create_app()
    app.dependency_overrides[get_db] = _get_db
    app.dependency_overrides[get_pts2_client] = lambda: FakeClient()
    # Reactiva la autenticación (el conftest la desactiva para el resto de tests)
    app.state.auth_enabled = True
    app.state.api_token_secret = "secret-de-prueba"

    return TestClient(app)


def test_protected_endpoint_rejects_without_token(auth_client):
    response = auth_client.get("/settings")
    assert response.status_code == 401
    assert response.json()["ok"] is False


def test_public_endpoints_open_without_token(auth_client):
    assert auth_client.get("/health").status_code == 200
    assert auth_client.get("/users").status_code == 200
    assert auth_client.get("/").status_code == 200


def test_login_issues_token_and_grants_access(auth_client):
    # PIN incorrecto → 401 y sin token
    bad = auth_client.post("/users/login", json={"username": "admin", "pin": "9999"})
    assert bad.status_code == 401

    # PIN correcto → token
    ok = auth_client.post("/users/login", json={"username": "admin", "pin": "1234"})
    assert ok.status_code == 200
    token = ok.json()["data"]["token"]
    assert token

    # Con el token, el endpoint protegido responde
    response = auth_client.get("/settings", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200

    # Token corrupto → 401
    response = auth_client.get("/settings", headers={"Authorization": "Bearer basura.invalida"})
    assert response.status_code == 401


def test_expired_token_is_rejected(auth_client):
    from pts2_api.security import create_session_token

    expired = create_session_token("admin", "Admin", "secret-de-prueba", ttl_seconds=-10)
    response = auth_client.get("/settings", headers={"Authorization": f"Bearer {expired}"})
    assert response.status_code == 401


def test_token_signed_with_other_secret_is_rejected(auth_client):
    from pts2_api.security import create_session_token

    forged = create_session_token("admin", "Admin", "otro-secreto")
    response = auth_client.get("/settings", headers={"Authorization": f"Bearer {forged}"})
    assert response.status_code == 401
