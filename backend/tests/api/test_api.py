from fastapi.testclient import TestClient

from pts2_api.dependencies import get_pts2_client
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

    def get_totals(self, pump_id):
        return FakeModel({"Pump": pump_id, "Totals": []})

    def get_prices(self, pump_id):
        return {"Pump": pump_id, "Prices": []}

    def set_prices(self, pump_id, prices):
        return {"Pump": pump_id, "Prices": prices}

    def get_display_data(self, pump_id):
        return {"Pump": pump_id, "Display": {}}

    def lock(self, pump_id):
        return {"Locked": pump_id}

    def unlock(self, pump_id):
        return {"Unlocked": pump_id}


class FakeClient:
    def __init__(self):
        self.pumps = FakePumps()

    def healthcheck(self):
        return {"ok": True, "datetime": {"DateTime": "2026-05-27T13:00:00"}}

    def close(self):
        pass


def make_test_client(fake_client):
    app = create_app()
    app.dependency_overrides[get_pts2_client] = lambda: fake_client
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


def test_authorize_volume_endpoint_calls_sdk():
    fake = FakeClient()
    client = make_test_client(fake)

    response = client.post("/pumps/1/authorize", json={"nozzle": 1, "type": "Volume", "dose": 20})

    assert response.status_code == 200
    assert response.json()["data"] == {"Accepted": True}
    assert fake.pumps.calls == [("authorize_volume", 1, 1, 20.0)]


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
