# PTS-2 SDK for Python

SDK Python para el controlador Technotrade PTS-2 Forecourt Controller usando el protocolo jsonPTS por HTTP/HTTPS.

El paquete esta organizado por dominios: configuracion, bombas, sondas, tanques, reportes, transporte, autenticacion, modelos, retries y errores. La capa de modelos permite campos extra para soportar variaciones de firmware o configuracion del controlador.

## Instalacion

```bash
python -m venv .venv
source .venv/bin/activate
pip install -e ".[all]"
```

Instalacion minima:

```bash
pip install -e .
```

## Configuracion

Copia `.env.example` a `.env` y ajusta los valores:

```env
PTS2_HOST=192.168.50.117
PTS2_PORT=80
PTS2_USE_HTTPS=false
PTS2_USERNAME=admin
PTS2_PASSWORD=admin
PTS2_AUTH_TYPE=basic
PTS2_VERIFY_SSL=false
PTS2_TIMEOUT=10
PTS2_RETRIES=3
```

La URL final sera:

```text
http://192.168.50.117:80/jsonPTS
```

Para HTTPS:

```env
PTS2_PORT=443
PTS2_USE_HTTPS=true
PTS2_VERIFY_SSL=false
```

`PTS2_VERIFY_SSL=false` es util cuando el PTS-2 usa certificado autofirmado.

## DIP-switch

- DIP-1 ON: HTTP.
- DIP-1 OFF: HTTPS.
- DIP-2 ON: Basic Auth.
- DIP-2 OFF: Digest Auth.

Configura `PTS2_AUTH_TYPE=basic` o `PTS2_AUTH_TYPE=digest` segun DIP-2.

## Uso rapido

```python
from pts2_sdk import PTS2Client

client = PTS2Client.from_env()

print(client.get_datetime())
print(client.get_network_settings())
print(client.pumps.get_status(1))
```

Tambien puedes construir el cliente manualmente:

```python
from pts2_sdk import PTS2Client

client = PTS2Client(
    host="192.168.50.117",
    username="admin",
    password="admin",
    https=False,
    auth_type="basic",
)
```

## Comandos implementados

Configuracion:

- `GetDateTime`
- `SetDateTime`
- `GetPtsNetworkSettings`
- `SetPtsNetworkSettings`
- `GetConfigurationIdentifier`
- `BackupConfiguration`
- `RestoreConfiguration`
- `GetRemoteServerConfiguration`
- `SetRemoteServerConfiguration`
- `GetParameter`
- `SetParameter`
- `Restart`

Bombas:

- `PumpGetStatus`
- `PumpAuthorize`
- `PumpStop`
- `PumpEmergencyStop`
- `PumpSuspend`
- `PumpResume`
- `PumpGetTotals`
- `PumpGetPrices`
- `PumpSetPrices`
- `PumpGetTransactionInformation`
- `PumpCloseTransaction`
- `PumpGetDisplayData`
- `PumpLock`
- `PumpUnlock`

Sondas y tanques:

- `ProbeGetMeasurements`
- `ProbeGetTankVolumeForHeight`
- `GetTanksConfiguration`
- `SetTanksConfiguration`

Reportes:

- `ReportGetPumpTransactions`
- `ReportGetTankMeasurements`
- `ReportGetInTankDeliveries`
- `ReportGetAlertRecords`
- `ReportGetGpsRecords`

## Ejemplos

```bash
python examples/get_datetime.py
python examples/get_network.py
python examples/pump_status.py
python examples/tank_measurements.py
python examples/reports.py
```

El ejemplo de autorizacion exige confirmacion para evitar disparos accidentales:

```bash
CONFIRM_AUTHORIZE=yes python examples/authorize_pump.py
```

## API REST con Swagger

El proyecto incluye una API FastAPI para integrar un POS web, local o backend externo sin hablar directo con el PTS-2.

Instala dependencias y arranca el servidor:

```bash
source .venv/bin/activate
pip install -e ".[all]"
uvicorn pts2_api.main:app --host 0.0.0.0 --port 8000 --reload
```

Swagger:

```text
http://localhost:8000/docs
```

ReDoc:

```text
http://localhost:8000/redoc
http://localhost:8000/redocs
```

OpenAPI JSON:

```text
http://localhost:8000/openapi.json
```

Endpoints principales:

- `GET /health`
- `GET /pumps/{pump_id}/status`
- `POST /pumps/{pump_id}/authorize`
- `POST /pumps/{pump_id}/stop`
- `POST /pumps/{pump_id}/emergency-stop`
- `POST /pumps/emergency-stop-all`
- `POST /pumps/{pump_id}/suspend`
- `POST /pumps/{pump_id}/resume`
- `GET /pumps/{pump_id}/transaction`
- `POST /pumps/{pump_id}/close-transaction`
- `GET /pumps/{pump_id}/totals`
- `GET /pumps/{pump_id}/prices`
- `PUT /pumps/{pump_id}/prices`
- `GET /pumps/{pump_id}/display`
- `POST /pumps/{pump_id}/lock`
- `POST /pumps/{pump_id}/unlock`
- `GET /probes/measurements`
- `GET /probes/{probe_id}/measurements`
- `GET /tanks/configuration`
- `GET /tanks/{tank_id}/volume-for-height?height=1200`
- `GET /reports/pump-transactions`
- `GET /reports/tank-measurements`
- `GET /reports/in-tank-deliveries`
- `GET /reports/alerts`
- `GET /reports/gps`

Ejemplo para autorizar por volumen desde Swagger o desde un POS:

```http
POST /pumps/1/authorize
Content-Type: application/json
```

```json
{
  "nozzle": 1,
  "type": "Volume",
  "dose": 20
}
```

Llenado libre:

```json
{
  "nozzle": 1
}
```

WebSocket opcional para monitoreo:

```text
ws://localhost:8000/ws/pumps?pump_id=1&interval=2
```

## Probar comunicacion con bomba

Primero valida conectividad y credenciales:

```bash
python examples/quick_test.py
```

Luego consulta una bomba:

```python
from pts2_sdk import PTS2Client

with PTS2Client.from_env() as client:
    status = client.pumps.get_status(1)
    print(status)
```

Estados frecuentes:

- `PumpIdleStatus`
- `PumpFillingStatus`
- `PumpEndOfTransactionStatus`
- `PumpOfflineStatus`

## Autorizar y detener bomba

```python
from pts2_sdk import PTS2Client

with PTS2Client.from_env() as client:
    client.pumps.authorize_volume(pump_id=1, nozzle=1, volume=5.0)
    client.pumps.authorize_amount(pump_id=1, nozzle=1, amount=500)
    client.pumps.authorize_free(pump_id=1, nozzle=1)
    # client.pumps.stop(1)
    # client.pumps.emergency_stop(1)
```

El SDK envia autorizaciones por preset con `Type` y `Dose`, por ejemplo:

```json
{
  "Pump": 1,
  "Nozzle": 1,
  "Type": "Volume",
  "Dose": 5.0
}
```

Tambien puedes controlar el flujo POS completo:

```python
client.pumps.suspend(1)
client.pumps.resume(1)
client.pumps.get_transaction_information(1)
client.pumps.close_transaction(1)
client.pumps.get_display_data(1)
client.pumps.lock(1)
client.pumps.unlock(1)
client.pumps.emergency_stop_all()
```

Guia detallada: [docs/PTS2_SDK_INTEGRATION_GUIDE.md](docs/PTS2_SDK_INTEGRATION_GUIDE.md).

## Tanques y sondas

```python
from pts2_sdk import PTS2Client

with PTS2Client.from_env() as client:
    print(client.probes.get_measurements(1))
    print(client.probes.get_all_measurements())
    print(client.tanks.get_tanks_configuration())
    print(client.tanks.get_tank_volume_for_height(tank_id=1, height=1200))
```

## Exportar reportes

```python
from pts2_sdk import PTS2Client

with PTS2Client.from_env() as client:
    records = client.reports.get_pump_transactions(
        pump_id=1,
        date_time_start="2026-05-01T00:00:00",
        date_time_end="2026-05-27T23:59:59",
    )
    client.reports.export_json(records, "reports/pump_transactions.json")
    client.reports.export_csv(records, "reports/pump_transactions.csv")
```

Con pandas:

```python
df = client.reports.to_dataframe(records)
```

## Cambiar IP del PTS-2

```python
from pts2_sdk import PTS2Client

with PTS2Client.from_env() as client:
    current = client.get_network_settings()
    print(current)

    client.set_network_settings({
        "IpAddress": "192.168.50.118",
        "Netmask": "255.255.255.0",
        "Gateway": "192.168.50.1",
    })
```

Despues de cambiar IP, actualiza `.env` con `PTS2_HOST`.

## Docker

```bash
cp .env.example .env
docker compose up --build
```

El compose monta:

- `./logs:/app/logs`
- `./reports:/app/reports`

## Troubleshooting

- Timeout: revisa IP, cableado, VLAN, firewall y `PTS2_PORT`.
- HTTP 401/403: revisa usuario, password y `PTS2_AUTH_TYPE`.
- Error SSL: usa `PTS2_VERIFY_SSL=false` si el certificado es autofirmado.
- Sin `Packets`: el endpoint podria no ser `/jsonPTS` o el equipo no esta en modo jsonPTS.
- Bomba `PumpOfflineStatus`: verifica protocolo/configuracion de puerto de bomba en PTS-2.
- HTTPS no responde: revisa DIP-1 y usa puerto 443.
- Basic/Digest no coincide: revisa DIP-2.

## Tests

```bash
pytest
```

Los tests usan un transporte simulado y no se conectan al equipo fisico.
