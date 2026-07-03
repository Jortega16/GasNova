import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from pts2_api.database import Base, get_db
# Import models to register SQLAlchemy tables
from pts2_api import models
from pts2_api.main import create_app
from pts2_api.dependencies import get_pts2_client
from tests.api.test_api import FakeClient
from pts2_api.models import PendingTransaction, PumpTransaction, ShiftClosure, PumpEventLog

# SQLite test database with StaticPool to keep connection alive
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(name="client")
def client_fixture():
    # Create the tables in the test database
    Base.metadata.create_all(bind=engine)
    
    app = create_app()
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_pts2_client] = lambda: FakeClient()
    
    with TestClient(app) as test_client:
        yield test_client
        
    # Drop the tables after testing
    Base.metadata.drop_all(bind=engine)


def test_postpay_authorize_calls_sdk(client):
    response = client.post("/pumps/1/postpay-authorize", json={"nozzle": 1})
    assert response.status_code == 200
    assert response.json()["ok"] is True
    assert response.json()["data"]["status"] == "Authorized"
    assert response.json()["data"]["mode"] == "Postpay"


def test_start_dispensing_returns_ok(client):
    response = client.post("/pumps/1/start-dispensing")
    assert response.status_code == 200
    assert response.json()["ok"] is True
    assert response.json()["data"]["pump_id"] == 1


def test_create_transaction_stores_in_db(client):
    payload = {
        "transaction_id": 999,
        "nozzle": 2,
        "volume": 25.5,
        "amount": 105.5,
        "unit_price": 4.13,
        "payment_type": "Cash",
        "status": "Completed"
    }
    response = client.post("/pumps/1/transactions", json=payload)
    assert response.status_code == 200
    assert response.json()["ok"] is True
    assert response.json()["data"]["transaction_id"] == 999
    assert "Completed" in response.json()["data"]["status"]


def test_pending_transaction_is_processed_into_completed_transaction(client):
    pending_payload = {
        "trx_id": "TRX-777",
        "nozzle": 1,
        "volume": 12.5,
        "amount": 50.0,
        "fuel_type": "Regular Unleaded",
        "pts_transaction_id": "PTS-777",
        "raw_payload": {"Transaction": 777, "FuelGradeName": "Regular Unleaded"},
        "station_code": "001",
        "pos_terminal_code": "POS-01",
    }
    response = client.post("/pumps/1/pending-transactions", json=pending_payload)
    assert response.status_code == 200
    assert response.json()["ok"] is True
    assert response.json()["data"]["created"] is True

    response = client.get("/pumps/pending-transactions")
    assert response.status_code == 200
    assert len(response.json()["data"]) == 1
    assert response.json()["data"][0]["trx_id"] == "TRX-777"

    response = client.post(
        "/pumps/1/pending-transactions/TRX-777/process",
        json={
            "payment_type": "Cash",
            "status": "Completed",
            "document_type": "Ticket",
            "document_number": "T-777",
            "payment_reference": "CASHBOX-1",
            "cashier_name": "Jane Cashier",
        },
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["created"] is True
    assert data["transaction_id"] == 777
    assert data["status"] == "Completed (Cash)"

    response = client.get("/pumps/pending-transactions")
    assert response.status_code == 200
    assert response.json()["data"] == []

    db = TestingSessionLocal()
    try:
        assert db.query(PendingTransaction).count() == 0
        completed = db.query(PumpTransaction).filter(PumpTransaction.transaction_id == 777).one()
        assert completed.pump_id == 1
        assert completed.amount == 50.0
        assert completed.unit_price == 4.0
        assert completed.source_pending_trx_id == "TRX-777"
        assert completed.document_type == "Ticket"
        assert completed.document_number == "T-777"
        assert completed.payment_reference == "CASHBOX-1"
        assert completed.cashier_name == "Jane Cashier"
        assert completed.station_code == "001"
        assert completed.pos_terminal_code == "POS-01"
        assert completed.raw_payload["Transaction"] == 777
    finally:
        db.close()


def test_processing_missing_pending_transaction_returns_404(client):
    response = client.post("/pumps/1/pending-transactions/TRX-404/process", json={})

    assert response.status_code == 404


def test_late_pending_write_does_not_recreate_completed_transaction(client):
    pending_payload = {
        "trx_id": "TRX-LATE",
        "nozzle": 1,
        "volume": 5.0,
        "amount": 20.0,
        "fuel_type": "Regular Unleaded",
    }
    response = client.post("/pumps/1/pending-transactions", json=pending_payload)
    assert response.status_code == 200
    assert response.json()["data"]["created"] is True

    response = client.post(
        "/pumps/1/pending-transactions/TRX-LATE/process",
        json={"payment_type": "Cash", "status": "Completed", "document_type": "Bajada"},
    )
    assert response.status_code == 200
    assert response.json()["data"]["created"] is True

    response = client.post("/pumps/1/pending-transactions", json=pending_payload)
    assert response.status_code == 200
    assert response.json()["data"]["created"] is False
    assert response.json()["data"]["status"] == "Completed"

    response = client.get("/pumps/pending-transactions")
    assert response.status_code == 200
    assert response.json()["data"] == []

    db = TestingSessionLocal()
    try:
        assert db.query(PendingTransaction).filter(PendingTransaction.trx_id == "TRX-LATE").count() == 0
        completed = db.query(PumpTransaction).filter(PumpTransaction.source_pending_trx_id == "TRX-LATE").one()
        assert completed.document_type == "Bajada"
    finally:
        db.close()


def test_delete_pending_transaction_moves_to_completed_as_bajada(client):
    pending_payload = {
        "trx_id": "TRX-BAJADA",
        "nozzle": 3,
        "volume": 9.5,
        "amount": 47.5,
        "fuel_type": "Diesel",
    }
    response = client.post("/pumps/2/pending-transactions", json=pending_payload)
    assert response.status_code == 200

    response = client.delete("/pumps/2/pending-transactions/TRX-BAJADA")
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["created"] is True
    assert data["document_type"] == "Bajada"
    assert data["source_pending_trx_id"] == "TRX-BAJADA"

    db = TestingSessionLocal()
    try:
        assert db.query(PendingTransaction).filter(PendingTransaction.trx_id == "TRX-BAJADA").count() == 0
        completed = db.query(PumpTransaction).filter(PumpTransaction.source_pending_trx_id == "TRX-BAJADA").one()
        assert completed.document_type == "Bajada"
        assert completed.amount == 47.5
    finally:
        db.close()


def test_upload_pump_transaction_is_saved_as_pending_not_completed(client):
    from pts2_api.routers.websocket import handle_packet
    import asyncio

    class FakeWebSocket:
        def __init__(self):
            self.messages = []

        async def send_text(self, message):
            self.messages.append(message)

    db = TestingSessionLocal()
    ws = FakeWebSocket()
    try:
        packet = {
            "Id": 1,
            "Type": "UploadPumpTransaction",
            "Data": {
                "Pump": 1,
                "Transaction": 888,
                "Nozzle": 1,
                "Volume": 8.0,
                "Amount": 32.0,
                "FuelGradeName": "Regular Unleaded",
            },
        }
        asyncio.run(handle_packet(packet, ws, db))

        pending = db.query(PendingTransaction).filter(PendingTransaction.trx_id == "888").one()
        assert pending.pump_id == 1
        assert pending.amount == 32.0
        assert pending.pts_transaction_id == "888"
        assert pending.raw_payload["FuelGradeName"] == "Regular Unleaded"
        assert pending.status == "Pending"
        assert db.query(PumpTransaction).count() == 0
        event = db.query(PumpEventLog).filter(PumpEventLog.pts_transaction_id == "888").one()
        assert event.event_type == "UploadPumpTransaction"
        assert event.raw_payload["Amount"] == 32.0
        assert ws.messages
    finally:
        db.close()


def test_create_delivery_stores_in_db(client):
    payload = {
        "volume": 5000.0,
        "product_code": "REG",
        "driver_name": "Chofer Test",
        "truck_number": "TRUCK-99",
        "notes": "Test delivery"
    }
    response = client.post("/tanks/1/deliveries", json=payload)
    assert response.status_code == 200
    assert response.json()["ok"] is True
    assert response.json()["data"]["volume"] == 5000.0


def test_users_crud_and_login(client):
    # 1. List users (seeds default users)
    response = client.get("/users")
    assert response.status_code == 200
    assert len(response.json()["data"]) == 4
    
    # 2. Verify login with correct PIN
    login_payload = {"username": "admin", "pin": "1234"}
    response = client.post("/users/login", json=login_payload)
    assert response.status_code == 200
    assert response.json()["data"]["username"] == "admin"
    
    # 3. Verify login with incorrect PIN
    login_payload = {"username": "admin", "pin": "9999"}
    response = client.post("/users/login", json=login_payload)
    assert response.status_code == 401
    
    # 4. Create new user
    new_user = {
        "username": "testuser",
        "name": "Test User",
        "role": "Operator",
        "avatar": "👤",
        "pin": "9999"
    }
    response = client.post("/users", json=new_user)
    assert response.status_code == 200
    assert response.json()["data"]["username"] == "testuser"
    user_id = response.json()["data"]["id"]
    
    # 5. Delete user
    response = client.delete(f"/users/{user_id}")
    assert response.status_code == 200
    assert response.json()["data"]["deleted"] is True


def test_shifts_close_and_open(client):
    # 1. Close active shift
    close_payload = {
        "shift_id": "SH-20240527-01",
        "operator_name": "John Doe",
        "end_time": "2026-06-04 12:00 PM",
        "status": "Closed"
    }
    response = client.post("/shifts/close", json=close_payload)
    assert response.status_code == 200
    assert response.json()["ok"] is True
    assert response.json()["data"]["closed_shift"]["shift_id"] == "SH-20240527-01"
    assert response.json()["data"]["closed_shift"]["status"] == "Closed"
    assert response.json()["data"]["new_shift"]["shift_id"] == "SH-20240527-02"
    assert response.json()["data"]["new_shift"]["status"] == "Active"
    
    # 2. Get shifts history
    response = client.get("/shifts")
    assert response.status_code == 200
    assert len(response.json()["data"]) == 2


def test_shift_close_blocks_when_pending_transactions_exist(client):
    response = client.get("/shifts")
    assert response.status_code == 200

    pending_payload = {
        "trx_id": "TRX-BLOCK",
        "nozzle": 1,
        "volume": 10.0,
        "amount": 40.0,
        "fuel_type": "Regular Unleaded",
    }
    response = client.post("/pumps/1/pending-transactions", json=pending_payload)
    assert response.status_code == 200

    close_payload = {
        "shift_id": "SH-20240527-01",
        "operator_name": "John Doe",
        "end_time": "2026-06-04 12:00 PM",
        "status": "Closed",
    }
    response = client.post("/shifts/close", json=close_payload)
    assert response.status_code == 409
    detail = response.json()["detail"]
    assert "despachos pendientes" in detail["message"]
    assert detail["pending_transactions"][0]["trx_id"] == "TRX-BLOCK"


def test_shift_close_creates_frozen_shift_closure(client):
    response = client.get("/shifts")
    assert response.status_code == 200

    payload = {
        "transaction_id": 555,
        "nozzle": 2,
        "volume": 20.0,
        "amount": 100.0,
        "unit_price": 5.0,
        "payment_type": "Tarjeta",
        "status": "Completed",
    }
    response = client.post("/pumps/1/transactions", json=payload)
    assert response.status_code == 200

    close_payload = {
        "shift_id": "SH-20240527-01",
        "operator_name": "John Doe",
        "end_time": "2026-06-04 12:00 PM",
        "status": "Closed",
    }
    response = client.post("/shifts/close", json=close_payload)
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["closure"]["shift_id"] == "SH-20240527-01"
    assert data["closure"]["total_sales"] == 100.0
    assert data["closure"]["total_volume"] == 20.0
    assert data["closure"]["transaction_count"] == 1
    assert data["closure"]["payment_breakdown"][0]["payment_type"] == "Tarjeta"

    db = TestingSessionLocal()
    try:
        closure = db.query(ShiftClosure).filter(ShiftClosure.shift_id == "SH-20240527-01").one()
        assert closure.total_sales == 100.0
        assert closure.pending_count == 0
    finally:
        db.close()


def test_scheduled_prices_crud_and_cancel(client):
    # 1. List scheduled prices (seeds 3 defaults)
    response = client.get("/scheduled-prices")
    assert response.status_code == 200
    assert len(response.json()["data"]) == 3

    # 2. Create a new price schedule
    new_schedule = {
        "id": "SP-100",
        "date_time": "2026-06-10 14:00",
        "fuel_type": "Regular Unleaded",
        "new_price": 4.30
    }
    response = client.post("/scheduled-prices", json=new_schedule)
    assert response.status_code == 200
    assert response.json()["ok"] is True
    assert response.json()["data"]["id"] == "SP-100"
    assert response.json()["data"]["status"] == "Pending"

    # 3. Verify it is included in list
    response = client.get("/scheduled-prices")
    assert response.status_code == 200
    assert len(response.json()["data"]) == 4

    # 4. Cancel the price schedule
    response = client.put("/scheduled-prices/SP-100/cancel")
    assert response.status_code == 200
    assert response.json()["data"]["status"] == "Cancelled"

    # 5. Cancel again should return 400
    response = client.put("/scheduled-prices/SP-100/cancel")
    assert response.status_code == 400


def test_scheduled_price_worker_applies_prices(client):
    from pts2_api.main import apply_scheduled_prices_cycle
    from pts2_api.models import DbScheduledPrice
    import asyncio

    db = TestingSessionLocal()
    try:
        schedule = DbScheduledPrice(
            id="SP-999",
            date_time="2020-01-01 12:00",
            fuel_type="Regular Unleaded",
            new_price=4.30,
            status="Pending"
        )
        db.add(schedule)
        db.commit()
    finally:
        db.close()

    # Run cycle manually
    db_test = TestingSessionLocal()
    try:
        asyncio.run(apply_scheduled_prices_cycle(db_test))
    finally:
        db_test.close()

    # Verify status changed to Applied
    db_verify = TestingSessionLocal()
    try:
        sched = db_verify.query(DbScheduledPrice).filter(DbScheduledPrice.id == "SP-999").first()
        assert sched is not None
        assert sched.status == "Applied"
    finally:
        db_verify.close()


def test_shift_transactions_association(client):
    from pts2_api.models import SystemSetting

    # 1. Trigger seeding of active shift by calling shifts list
    response = client.get("/shifts")
    assert response.status_code == 200
    shifts = response.json()["data"]
    assert len(shifts) > 0
    active_shift_id = shifts[0]["shift_id"]
    assert active_shift_id == "SH-20240527-01"

    db = TestingSessionLocal()
    try:
        db.add(SystemSetting(key="unit_measure", value="Galones"))
        db.commit()
    finally:
        db.close()

    # 2. Create a pump transaction (stored in Liters)
    # 37.8541 liters = 10 gallons
    payload = {
        "transaction_id": 12345,
        "nozzle": 1,
        "volume": 37.8541,
        "amount": 40.0,
        "unit_price": 4.0,
        "payment_type": "Tarjeta",
        "status": "Completed"
    }
    response = client.post("/pumps/2/transactions", json=payload)
    assert response.status_code == 200
    assert response.json()["ok"] is True

    # 3. Retrieve transactions for that shift
    response = client.get(f"/shifts/{active_shift_id}/transactions")
    assert response.status_code == 200
    txs = response.json()["data"]
    assert len(txs) == 1
    tx = txs[0]
    
    assert tx["id"] == "TRX-12345"
    assert tx["pumpId"] == 2
    assert tx["pumpName"] == "Cara 2"
    assert tx["volume"] == 10.0  # converted from 37.8541 liters to gallons
    assert tx["amount"] == 40.0
    assert tx["fuelType"] == "Regular Unleaded"
    assert tx["paymentType"] == "Tarjeta"
    assert "dateTime" in tx
