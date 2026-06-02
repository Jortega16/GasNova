# PTS-2 SDK Integration Guide

Integracion basica del controlador PTS-2 usando el protocolo `jsonPTS`.

## Descripcion

El controlador PTS-2 permite controlar:

- Surtidores de combustible
- Tanques ATG
- Lectores RFID
- Price boards
- GPS
- Monitoreo remoto

mediante una API JSON sobre HTTP/HTTPS.

El sistema actua como middleware entre el software POS/backend y los dispositivos fisicos del patio.

## Comunicacion

Endpoint HTTP:

```text
http://IP_DEL_PTS/jsonPTS
```

Endpoint HTTPS:

```text
https://IP_DEL_PTS/jsonPTS
```

Para el equipo probado en este proyecto:

```text
https://192.168.50.117/jsonPTS
```

con `Digest Authentication` y certificado no verificado.

## Autenticacion

El PTS-2 soporta:

- Basic Authentication
- Digest Authentication

En el SDK:

```env
PTS2_AUTH_TYPE=basic
```

o:

```env
PTS2_AUTH_TYPE=digest
```

## Headers HTTP

```http
POST /jsonPTS HTTP/1.1
Content-Type: application/json; charset=utf-8
Accept: */*
Authorization: Basic XXXXX
```

Con Digest, `requests` negocia el encabezado `Authorization` automaticamente.

## Estructura general de request

```json
{
  "Protocol": "jsonPTS",
  "Packets": [
    {
      "Id": 1,
      "Type": "PumpGetStatus",
      "Data": {
        "Pump": 1
      }
    }
  ]
}
```

Equivalente con el SDK:

```python
from pts2_sdk import PTS2Client

with PTS2Client.from_env() as client:
    status = client.pumps.get_status(1)
    print(status)
```

## Comandos principales

### 1. Obtener estado del surtidor

jsonPTS:

```json
{
  "Protocol": "jsonPTS",
  "Packets": [
    {
      "Id": 1,
      "Type": "PumpGetStatus",
      "Data": {
        "Pump": 1
      }
    }
  ]
}
```

SDK:

```python
client.pumps.get_status(1)
```

Estados posibles:

- `PumpIdleStatus`
- `PumpFillingStatus`
- `PumpEndOfTransactionStatus`
- `PumpOfflineStatus`

### 2. Autorizar venta por volumen

jsonPTS:

```json
{
  "Protocol": "jsonPTS",
  "Packets": [
    {
      "Id": 2,
      "Type": "PumpAuthorize",
      "Data": {
        "Pump": 1,
        "Nozzle": 1,
        "Type": "Volume",
        "Dose": 20
      }
    }
  ]
}
```

SDK:

```python
client.pumps.authorize_volume(pump_id=1, nozzle=1, volume=20)
```

Tambien:

```python
client.pumps.authorize(pump_id=1, nozzle=1, volume=20)
```

### 3. Autorizar venta por importe

jsonPTS:

```json
{
  "Protocol": "jsonPTS",
  "Packets": [
    {
      "Id": 3,
      "Type": "PumpAuthorize",
      "Data": {
        "Pump": 1,
        "Nozzle": 1,
        "Type": "Amount",
        "Dose": 500
      }
    }
  ]
}
```

SDK:

```python
client.pumps.authorize_amount(pump_id=1, nozzle=1, amount=500)
```

Tambien:

```python
client.pumps.authorize(pump_id=1, nozzle=1, amount=500)
```

### 4. Autorizar llenado libre

jsonPTS:

```json
{
  "Protocol": "jsonPTS",
  "Packets": [
    {
      "Id": 4,
      "Type": "PumpAuthorize",
      "Data": {
        "Pump": 1,
        "Nozzle": 1
      }
    }
  ]
}
```

SDK:

```python
client.pumps.authorize_free(pump_id=1, nozzle=1)
```

### 5. Detener surtidor

SDK:

```python
client.pumps.stop(1)
```

jsonPTS generado:

```json
{
  "Protocol": "jsonPTS",
  "Packets": [
    {
      "Id": 5,
      "Type": "PumpStop",
      "Data": {
        "Pump": 1
      }
    }
  ]
}
```

### 6. Paro de emergencia

Una bomba:

```python
client.pumps.emergency_stop(1)
```

Todas las bombas:

```python
client.pumps.emergency_stop_all()
```

El paro general envia `Pump: 0`.

### 7. Suspender venta

```python
client.pumps.suspend(1)
```

### 8. Reanudar venta

```python
client.pumps.resume(1)
```

### 9. Obtener informacion de transaccion

```python
client.pumps.get_transaction_information(1)
```

### 10. Cerrar transaccion

```python
client.pumps.close_transaction(1)
```

### 11. Leer totales electronicos

```python
client.pumps.get_totals(1)
```

### 12. Obtener precios

```python
client.pumps.get_prices(1)
```

### 13. Cambiar precios

```python
client.pumps.set_prices(
    pump_id=1,
    prices=[
        {
            "Nozzle": 1,
            "Price": 23.99,
        }
    ],
)
```

### 14. Leer display del surtidor

```python
client.pumps.get_display_data(1)
```

### 15. Bloquear surtidor

```python
client.pumps.lock(1)
```

### 16. Desbloquear surtidor

```python
client.pumps.unlock(1)
```

## Ejemplo Python con requests

```python
import requests
from requests.auth import HTTPDigestAuth

PTS_IP = "192.168.50.117"
URL = f"https://{PTS_IP}/jsonPTS"

USER = "admin"
PASSWORD = "admin"

payload = {
    "Protocol": "jsonPTS",
    "Packets": [
        {
            "Id": 1,
            "Type": "PumpGetStatus",
            "Data": {
                "Pump": 1
            }
        }
    ]
}

response = requests.post(
    URL,
    json=payload,
    auth=HTTPDigestAuth(USER, PASSWORD),
    verify=False,
)

print(response.json())
```

## Flujo tipico POS

1. `PumpGetStatus`
2. `PumpAuthorize`
3. `PumpGetStatus` en polling
4. Esperar `PumpEndOfTransactionStatus`
5. `PumpGetTransactionInformation`
6. `PumpCloseTransaction`

Ejemplo SDK:

```python
from pts2_sdk import PTS2Client

with PTS2Client.from_env() as client:
    status = client.pumps.get_status(1)
    print(status)

    client.pumps.authorize_amount(pump_id=1, nozzle=1, amount=500)

    while True:
        status = client.pumps.get_status(1)
        if status.status == "PumpEndOfTransactionStatus":
            break

    transaction = client.pumps.get_transaction_information(1)
    client.pumps.close_transaction(1)
    print(transaction)
```

## Caracteristicas del PTS-2

- Hasta 120 surtidores
- Hasta 20 tanques
- HTTP / HTTPS
- SSL/TLS 1.2
- JSON API
- WebSocket
- RFID
- ATG
- Price boards
- Reportes
- GPS
- Upload a servidor remoto

## Referencias

- PTS-2 Technical Guide
- jsonPTS Communication Protocol
- Technotrade LLC
