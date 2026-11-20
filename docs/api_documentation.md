# AgroVerse AI — API Documentation

Interactive OpenAPI / Swagger documentation is available at `http://127.0.0.1:8000/docs`.

---

## 1. Telemetry Ingestion
### `POST /api/telemetry`
Receives live telemetry from the ESP8266 microcontroller or the Web Telemetry Feeder.

**Headers**:
- `Content-Type: application/json`
- `Authorization: Bearer <AGRO_DEVICE_TOKEN>` (optional for web feeder)

**Request Body**:
```json
{
  "device_id": "AGRO_001",
  "soil_moisture": 28.5,
  "temperature": 29.4,
  "humidity": 58.2,
  "pump": false,
  "mode": "auto",
  "rssi": -62
}
```

**Response (200 OK)**:
```json
{
  "status": "success",
  "message": "Telemetry processed and broadcasted",
  "device_id": "AGRO_001",
  "server_time": "2026-11-20T02:00:00.000000",
  "pending_command": null
}
```

---

## 2. Latest Sensor Reading
### `GET /api/sensors/latest?device_id=AGRO_001`
Retrieves the most recent verified sensor readings, status tags, and pump metrics.

**Response (200 OK)**:
```json
{
  "soil_moisture": {
    "current": 34.2,
    "status": "optimal",
    "threshold_low": 30.0,
    "threshold_high": 75.0,
    "unit": "%"
  },
  "temperature": {
    "current": 28.6,
    "status": "optimal",
    "unit": "°C"
  },
  "humidity": {
    "current": 62.4,
    "status": "optimal",
    "unit": "%"
  },
  "pump": {
    "state": false,
    "mode": "auto",
    "last_activated": "2026-11-20T00:30:00.000000",
    "total_duration_today_sec": 420,
    "estimated_water_liters_today": 18.5
  },
  "device": {
    "device_id": "AGRO_001",
    "name": "AgroVerse ESP8266 Node #1",
    "is_online": true,
    "last_seen": "2026-11-20T02:00:00.000000",
    "firmware_version": "1.0.0"
  },
  "last_updated": "2026-11-20T02:00:00.000000"
}
```

---

## 3. Sensor History
### `GET /api/sensors/history?device_id=AGRO_001&hours=24`
Returns time-series telemetry records for graphical trend visualization.

---

## 4. Manual Irrigation Control
### `POST /api/irrigation/control`
Dispatches a manual pump command to the hardware relay.

**Request Body**:
```json
{
  "device_id": "AGRO_001",
  "command": true,
  "duration_seconds": 180,
  "reason": "Manual dashboard control"
}
```

---

## 5. Mode & Threshold Calibration
### `POST /api/irrigation/mode`
Updates the automatic mode setpoints.

**Request Body**:
```json
{
  "device_id": "AGRO_001",
  "mode": "auto",
  "moisture_threshold_low": 30.0,
  "moisture_threshold_high": 75.0
}
```

---

## 6. AI Insights
### `GET /api/ai/insights?device_id=AGRO_001`
Evaluates live telemetry and returns a decision regarding irrigation urgency.

---

## 7. Conversational AI Chat
### `POST /api/ai/chat`
Answers questions regarding the farm's hydrological conditions.

**Request Body**:
```json
{
  "message": "Does my farm need water?",
  "device_id": "AGRO_001",
  "user_id": "farmer_1"
}
```
