# AgroVerse AI — System Architecture Specification

## 1. Executive Architecture Overview

AgroVerse AI is an enterprise-grade IoT smart agriculture platform combining physical microcontroller telemetry, real-time hydrological modeling, an interactive WebGL 3D digital twin, and a conversational agronomist AI assistant.

```
+-----------------------------------------------------------------------------------+
|                              AGROVERSE AI ARCHITECTURE                             |
+-----------------------------------------------------------------------------------+

[ PHYSICAL LAYER ]              [ EDGE TELEMETRY ]           [ BACKEND CLOUD / LOCAL ]
+---------------------+         +------------------+         +----------------------+
| Capacitive Moisture |-(A0)--->|                  |-(WiFi)->| FastAPI REST Engine  |
| DHT22 Climate Probe |-(D4)--->|     ESP8266      | HTTP/WS | SQLite / PostgreSQL  |
| 12V Solenoid Pump   |<-(D1)---|  Microcontroller |<--------| WebSocket Broadcast  |
+---------------------+         +------------------+         +----------+-----------+
                                                                        |
                                                                        | JSON / WS
                                                                        v
                                                             +----------------------+
                                                             |  Next.js 14 WebApp   |
                                                             |  - 3D Digital Twin   |
                                                             |  - Agro AI Chatbot   |
                                                             |  - Telemetry Feeder  |
                                                             |  - Analytics Deck    |
                                                             +----------------------+
```

---

## 2. Core Subsystems

### A. Telemetry & Hardware Edge Pipeline
1. **Sensors**:
   - Capacitive Volumetric Soil Moisture (Analog Pin A0).
   - DHT22 Digital Temperature and Relative Humidity (GPIO 2 / Pin D4).
2. **Actuator**:
   - 5V Single-Channel Relay (GPIO 5 / Pin D1) switching a 12V DC submersible pump.
3. **Fail-Safe Mechanism**:
   - If WiFi connectivity is severed, the ESP8266 continues autonomous local threshold checks, ensuring crop survival without cloud dependence.
   - Built-in watchdog timer enforces a maximum continuous pump actuation limit of 600 seconds (10 minutes).

### B. Backend Engine (FastAPI)
- **High-Performance Asynchronous Architecture**: FastAPI with Pydantic validation.
- **Relational Storage**: SQLAlchemy ORM with SQLite (local development) and Supabase PostgreSQL (production).
- **Dual Communication**:
  - Synchronous REST endpoints for deterministic commands and audit log queries.
  - Asynchronous WebSockets (`/api/ws/telemetry`) for <100ms real-time dashboard broadcast.

### C. 3D Digital Twin Pipeline (WebGL / React Three Fiber)
- **Procedural Geometry**:
  - Divided agricultural plots with dynamic color lerping (`useFrame`):
    - Arid (<30%): Warm Clay Brown (`#945d31`).
    - Optimal (30-75%): Fertile Dark Loam (`#433022`).
    - Saturated (>75%): Damp Cyan-Tinted Earth (`#253f47`).
- **Water Distribution Particles**: Three.js particle system with additive blending emitting spray during pump actuation.
- **Micro-Animations**: Procedural wind oscillation in crop foliage.
- **2D Schematic Fallback**: Low-power SVG blueprint mode for resource-constrained devices.

### D. Agro AI Conversational Consultant
- **Hybrid Intelligence**:
  - Direct context ingestion of live telemetry (Moisture %, Air Temp °C, Relative Humidity %, Pump Relay State, Thresholds).
  - Domain-specific agronomy heuristics computing Vapor Pressure Deficit (VPD), capillary water saturation, and plant water requirements.
  - Standardized LLM provider abstraction (Gemini / OpenAI / Local).
