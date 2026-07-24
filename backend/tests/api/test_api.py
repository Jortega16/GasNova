from types import SimpleNamespace

from fastapi.testclient import TestClient

from pts2_api.dependencies import get_pts2_client
from pts2_api.live_state import live_state
from pts2_api.main import create_app


class FakeModel:
    def __init__(self, data):
        self.data = data

    def model_dump(self, **_kwargs):
        return self.data


class FakePumps:
    def __init__(self):
        self.calls = []

    def get_status(self, pump_id):
        self.calls.append(("get_status", pump_id))
        return FakeModel({"Pump": pump_id, "Status": "PumpIdleStatus"})

    def authorize_free(self, pump_id, nozzle=None):
        self.calls.append(("authorize_free", pump_id, nozzle))
        return {"Accepted": True}

    def authorize_volume(self, pump_id, nozzle, volume):
        self.calls.append(("authorize_volume", pump_id, nozzle, volume))
        return {"Accepted": True}

    def authorize_amount(self, pump_id, nozzle, amount):
        self.calls.append(("authorize_amount", pump_id, nozzle, amount))
        return {"Accepted": True}

    def stop(self, pump_id):
        return {"Stopped": pump_id}

    def emergency_stop(self, pump_id):
        return {"EmergencyStopped": pump_id}

    def emergency_stop_all(self):
        return {"EmergencyStopped": 0}

    def suspend(self, pump_id):
        return {"Suspended": pump_id}

    def resume(self, pump_id):
        return {"Resumed": pump_id}

    def get_transaction_information(self, pump_id):
        return FakeModel({"Pump": pump_id, "Transaction": 10})

    def close_transaction(self, pump_id):
        return {"Closed": pump_id}

    def get_totals(self, pump_id, nozzle=None, fuel_grade_id=None):
        self.calls.append(("get_totals", pump_id, nozzle, fuel_grade_id))
        n = nozzle or 1
        # Totales electrónicos simulados por manguera (protocolo PumpTotals.Volume/Amount)
        return FakeModel({
            "Pump": pump_id,
            "Nozzle": n,
            "Volume": 1000.0 * n,
            "Amount": 5000.0 * n,
        })

    def get_prices(self, pump_id):
        return {"Pump": pump_id, "Prices": []}

    def set_prices(self, pump_id, prices):
        self.calls.append(("set_prices", pump_id, prices))
        return {"Pump": pump_id, "Prices": prices}

    def get_display_data(self, pump_id):
        return {"Pump": pump_id, "Display": {}}

    def lock(self, pump_id):
        return {"Locked": pump_id}

    def unlock(self, pump_id):
        return {"Unlocked": pump_id}


class FakeProbes:
    def __init__(self, measurements=None):
        self.measurements = measurements if measurements is not None else []

    def get_all_measurements(self):
        return [FakeModel(m) for m in self.measurements]


class FakeClient:
    def __init__(self):
        self.pumps = FakePumps()
        self.probes = FakeProbes()
        self.requests = []
        self.send_response_packets: list = []

    def request_data(self, request_type, data=None):
        self.requests.append((request_type, data))
        if request_type == "GetFuelGradesConfiguration":
            return {
                "FuelGrades": [
                    {"Id": 1, "Name": "Regular Unleaded", "Price": 4.0},
                    {"Id": 2, "Name": "Premium Unleaded", "Price": 4.5},
                    {"Id": 3, "Name": "Diesel", "Price": 4.2},
                    {"Id": 4, "Name": "GLP", "Price": 3.0},
                ]
            }
        if request_type == "GetPumpNozzlesConfiguration":
            return {
                "PumpNozzles": [
                    {"PumpId": 1, "FuelGradeIds": [1, 2, 3]},
                    {"PumpId": 2, "FuelGradeIds": [1, 2, 3]},
                ]
            }
        if request_type == "SetFuelGradesPrices":
            return {"Accepted": True}
        return {"Accepted": True}

    def send(self, packets):
        self.requests.append(("send", packets))
        return SimpleNamespace(packets=self.send_response_packets)

    def healthcheck(self):
        return {"ok": True, "datetime": {"DateTime": "2026-05-27T13:00:00"}}

    def close(self):
        pass


def make_test_client(fake_client):
    """App de prueba con PTS-2 falso y base de datos SQLite en memoria.

    Los endpoints que tocan la BD (authorize captura el turno activo, etc.)
    necesitan un engine real con tablas — el lifespan no corre aquí (TestClient
    sin context manager) y en modo test tampoco tocaría la BD real.
    """
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from sqlalchemy.pool import StaticPool
    from pts2_api.database import Base, get_db
    from pts2_api import models  # noqa: F401 — registra las tablas en Base

    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    def _override_get_db():
        db = TestingSession()
        try:
            yield db
        finally:
            db.close()

    app = create_app()
    app.dependency_overrides[get_pts2_client] = lambda: fake_client
    app.dependency_overrides[get_db] = _override_get_db
    return TestClient(app)


def test_openapi_and_health_are_available():
    fake = FakeClient()
    client = make_test_client(fake)

    assert client.get("/openapi.json").status_code == 200
    assert client.get("/docs").status_code == 200
    redoc = client.get("/redoc")
    redocs = client.get("/redocs")
    assert redoc.status_code == 200
    assert redocs.status_code == 200
    assert "GasNova PTS-2 API - ReDoc" in redoc.text
    assert "GasNova PTS-2 API - ReDoc" in redocs.text
    assert "/openapi.json" in redoc.text
    assert "/openapi.json" in redocs.text
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["ok"] is True


def test_pump_status_endpoint():
    fake = FakeClient()
    client = make_test_client(fake)

    response = client.get("/pumps/1/status")

    assert response.status_code == 200
    assert response.json()["data"] == {"Pump": 1, "Status": "PumpIdleStatus"}


def test_status_all_populates_live_price_cache():
    live_state.clear()
    fake = FakeClient()
    fake.send_response_packets = [
        SimpleNamespace(
            id=1,
            type="PumpIdleStatus",
            data={"Pump": 1, "NozzlePrices": [1.25, 1.69, 1.33, 1.44]},
        )
    ]
    client = make_test_client(fake)

    status_response = client.get("/pumps/status-all?pump_count=1")
    assert status_response.status_code == 200

    # /prices debe servir directo desde la caché poblada por status-all,
    # sin llamar a client.pumps.get_prices (que devolvería otra forma de dato).
    prices_response = client.get("/pumps/1/prices")
    assert prices_response.status_code == 200
    data = prices_response.json()["data"]
    assert data["NozzlePrices"] == [1.25, 1.69, 1.33, 1.44]
    assert data["_source"] == "live_cache"
    live_state.clear()


def test_prices_endpoint_falls_back_to_live_poll_when_cache_is_empty():
    live_state.clear()
    fake = FakeClient()
    client = make_test_client(fake)

    response = client.get("/pumps/1/prices")

    assert response.status_code == 200
    # FakePumps.get_prices() devuelve {"Pump": pump_id, "Prices": []} —
    # distinto de la forma NozzlePrices de la caché, así confirmamos que
    # se usó el camino en vivo y no un remanente de otra prueba.
    assert response.json()["data"] == {"Pump": 1, "Prices": []}


def test_live_state_endpoint_merges_pumps_and_tanks():
    live_state.clear()
    fake = FakeClient()
    fake.send_response_packets = [
        SimpleNamespace(
            id=1,
            type="PumpIdleStatus",
            data={"Pump": 1, "NozzlePrices": [1.25, 1.69]},
        )
    ]
    fake.probes = FakeProbes([{"Probe": 1, "ProductVolume": 15234.5, "Temperature": 21.3}])
    client = make_test_client(fake)

    response = client.get("/live/state?pump_count=1")

    assert response.status_code == 200
    data = response.json()["data"]
    assert data["pumps"][0]["pump"] == 1
    assert data["pumps"][0]["nozzle_prices"] == [1.25, 1.69]
    assert data["tanks"][0]["Probe"] == 1
    assert data["tanks"][0]["ProductVolume"] == 15234.5

    # El snapshot también deja la caché lista para /pumps/1/prices.
    prices_response = client.get("/pumps/1/prices")
    assert prices_response.json()["data"]["_source"] == "live_cache"
    live_state.clear()


def test_authorize_volume_endpoint_calls_sdk():
    fake = FakeClient()
    client = make_test_client(fake)

    response = client.post("/pumps/1/authorize", json={"nozzle": 1, "type": "Volume", "dose": 20})

    assert response.status_code == 200
    assert response.json()["data"] == {"Accepted": True}
    # Con preset (type+dose) el endpoint arma el payload jsonPTS completo
    assert fake.requests == [
        ("PumpAuthorize", {"Pump": 1, "Nozzle": 1, "Type": "Volume", "Dose": 20.0}),
    ]


def test_authorize_free_endpoint_calls_sdk():
    fake = FakeClient()
    client = make_test_client(fake)

    response = client.post("/pumps/1/authorize", json={"nozzle": 1})

    assert response.status_code == 200
    assert response.json()["data"] == {"Accepted": True}
    assert fake.pumps.calls == [("authorize_free", 1, 1)]


def test_alerts_endpoint_rejects_invalid_datetime():
    fake = FakeClient()
    client = make_test_client(fake)

    response = client.get("/reports/alerts?date_time_start=2026-05-5T00:00:00&date_time_end=2026-05-26T23:59:59")

    assert response.status_code == 422
    assert any(
        error["type"] in {
            "value_error.datetime",
            "type_error.datetime",
            "datetime_from_date_parsing",
        }
        for error in response.json()["detail"]
    )


def test_pump_counters_sums_nozzle_totals_via_pump_get_totals():
    """GET /counters debe usar PumpGetTotals (Volume/Amount), no GetPumpStatus."""
    fake = FakeClient()
    client = make_test_client(fake)

    # Sin config local → consulta mangueras 1..6 (default)
    response = client.get("/pumps/1/counters")
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["source"] == "PumpGetTotals"
    assert data["pump_id"] == 1
    # 1000+2000+...+6000 = 21000 ; amounts 5000*n
    assert data["total_volume"] == 21000.0
    assert data["total_amount"] == 105000.0
    assert len(data["nozzles"]) == 6
    assert fake.pumps.calls == [
        ("get_totals", 1, 1, None),
        ("get_totals", 1, 2, None),
        ("get_totals", 1, 3, None),
        ("get_totals", 1, 4, None),
        ("get_totals", 1, 5, None),
        ("get_totals", 1, 6, None),
    ]
