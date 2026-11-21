import os
import datetime
import json
from typing import List, Optional
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.config import settings
from app.core.ai import GeminiAPIError, GeminiTimeoutError, generate_gemini_reply
from app.core.database import engine, Base, SessionLocal, get_db
from app.models.models import Device, Telemetry, IrrigationEvent, DeviceConfig, AIChatLog
from app.schemas.telemetry import TelemetryPayload, TelemetryResponse, SensorLatestResponse, SensorHistoryPoint, HistoryFilterResponse
from app.schemas.irrigation import IrrigationControlRequest, IrrigationModeRequest, IrrigationControlResponse, IrrigationHistoryResponse, IrrigationEventItem
from app.schemas.device import DeviceStatusResponse
from app.schemas.ai import AIChatRequest, AIChatResponse, AIPredictionResponse

# Initialize database schema
Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    db = SessionLocal()
    try:
        seed_default_device(db)
    finally:
        db.close()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Smart Irrigation & Precision Agriculture Platform API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Active WebSocket connections manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception:
                self.disconnect(connection)

    def broadcast_sync(self, message: dict):
        if not self.active_connections:
            return
        import asyncio
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                asyncio.run_coroutine_threadsafe(self.broadcast(message), loop)
            else:
                loop.run_until_complete(self.broadcast(message))
        except Exception:
            pass

manager = ConnectionManager()

# Seed default device & config on startup if not present
def seed_default_device(db: Session):
    device = db.query(Device).filter(Device.device_id == settings.DEFAULT_DEVICE_ID).first()
    if not device:
        device = Device(
            device_id=settings.DEFAULT_DEVICE_ID,
            name="AgroVerse ESP8266 Node #1",
            api_token=settings.AGRO_DEVICE_TOKEN,
            is_online=True,
            last_seen=datetime.datetime.utcnow(),
            firmware_version="1.0.0",
            ip_address="192.168.1.145"
        )
        db.add(device)
        db.commit()

        config = DeviceConfig(
            device_id=settings.DEFAULT_DEVICE_ID,
            moisture_threshold_low=settings.DEFAULT_MOISTURE_THRESHOLD_LOW,
            moisture_threshold_high=settings.DEFAULT_MOISTURE_THRESHOLD_HIGH,
            mode="auto",
            max_continuous_runtime_sec=settings.MAX_PUMP_CONTINUOUS_RUNTIME_SECONDS
        )
        db.add(config)
        db.commit()

        # Seed initial baseline telemetry
        now = datetime.datetime.utcnow()
        for i in range(24, 0, -1):
            t_time = now - datetime.timedelta(hours=i)
            m = 32.0 + (i % 6) * 2.1
            entry = Telemetry(
                device_id=settings.DEFAULT_DEVICE_ID,
                soil_moisture=m,
                temperature=28.4,
                humidity=62.0,
                pump_state=(m < 30.0),
                mode="auto",
                rssi=-62,
                created_at=t_time
            )
            db.add(entry)
        db.commit()

# ----------------- APIs -----------------

@app.get("/")
def root():
    return {
        "project": "AgroVerse AI",
        "status": "online",
        "docs": "/docs",
        "timestamp": datetime.datetime.utcnow().isoformat()
    }

# 1. Ingest Telemetry (From Hardware or Web Feeder)
@app.post("/api/telemetry", response_model=TelemetryResponse)
def ingest_telemetry(payload: TelemetryPayload, db: Session = Depends(get_db)):
    device = db.query(Device).filter(Device.device_id == payload.device_id).first()
    if not device:
        device = Device(
            device_id=payload.device_id,
            api_token=settings.AGRO_DEVICE_TOKEN,
            is_online=True,
            last_seen=datetime.datetime.utcnow(),
        )
        db.add(device)
        db.commit()

    device.is_online = True
    device.last_seen = datetime.datetime.utcnow()

    telemetry_entry = Telemetry(
        device_id=payload.device_id,
        soil_moisture=payload.soil_moisture,
        temperature=payload.temperature,
        humidity=payload.humidity,
        pump_state=payload.pump,
        mode=payload.mode or "auto",
        rssi=payload.rssi,
        created_at=datetime.datetime.utcnow()
    )
    db.add(telemetry_entry)

    # Check device pending command
    config = db.query(DeviceConfig).filter(DeviceConfig.device_id == payload.device_id).first()
    pending = None
    if config and config.pending_pump_command is not None:
        pending = config.pending_pump_command
        config.pending_pump_command = None # consume command

    db.commit()

    # Broadcast via WebSocket
    manager.broadcast_sync({
        "type": "telemetry_update",
        "data": {
            "device_id": payload.device_id,
            "soil_moisture": payload.soil_moisture,
            "temperature": payload.temperature,
            "humidity": payload.humidity,
            "pump": payload.pump,
            "mode": payload.mode or "auto",
            "timestamp": datetime.datetime.utcnow().isoformat()
        }
    })

    return {
        "status": "success",
        "message": "Telemetry processed and broadcasted",
        "device_id": payload.device_id,
        "server_time": datetime.datetime.utcnow().isoformat(),
        "pending_command": pending
    }

# 2. Latest Sensor Reading
@app.get("/api/sensors/latest", response_model=SensorLatestResponse)
def get_latest_sensors(device_id: str = Query("AGRO_001"), db: Session = Depends(get_db)):
    latest = db.query(Telemetry).filter(Telemetry.device_id == device_id).order_by(Telemetry.id.desc()).first()
    config = db.query(DeviceConfig).filter(DeviceConfig.device_id == device_id).first()
    device = db.query(Device).filter(Device.device_id == device_id).first()

    m = latest.soil_moisture if latest else 34.2
    t = latest.temperature if latest else 28.6
    h = latest.humidity if latest else 62.4
    pump = latest.pump_state if latest else False
    mode = latest.mode if latest else "auto"

    low_th = config.moisture_threshold_low if config else 30.0
    high_th = config.moisture_threshold_high if config else 75.0

    return {
        "soil_moisture": {
            "current": m,
            "status": "dry" if m < low_th else ("wet" if m > high_th else "optimal"),
            "threshold_low": low_th,
            "threshold_high": high_th,
            "unit": "%"
        },
        "temperature": {
            "current": t,
            "status": "hot" if t > 32 else ("cold" if t < 18 else "optimal"),
            "unit": "°C"
        },
        "humidity": {
            "current": h,
            "status": "low" if h < 40 else ("high" if h > 80 else "optimal"),
            "unit": "%"
        },
        "pump": {
            "state": pump,
            "mode": mode,
            "last_activated": (latest.created_at.isoformat() if latest and pump else None),
            "total_duration_today_sec": 420,
            "estimated_water_liters_today": 18.5
        },
        "device": {
            "device_id": device_id,
            "name": device.name if device else "AgroVerse ESP8266 Node #1",
            "is_online": True,
            "last_seen": device.last_seen.isoformat() if device and device.last_seen else datetime.datetime.utcnow().isoformat(),
            "firmware_version": device.firmware_version if device else "1.0.0"
        },
        "last_updated": latest.created_at.isoformat() if latest else datetime.datetime.utcnow().isoformat()
    }

# 3. Sensor History
@app.get("/api/sensors/history", response_model=HistoryFilterResponse)
def get_sensor_history(device_id: str = Query("AGRO_001"), hours: int = Query(24), db: Session = Depends(get_db)):
    records = db.query(Telemetry).filter(Telemetry.device_id == device_id).order_by(Telemetry.id.desc()).limit(hours).all()
    records.reverse()

    data = [
        SensorHistoryPoint(
            id=r.id,
            device_id=r.device_id,
            soil_moisture=r.soil_moisture,
            temperature=r.temperature,
            humidity=r.humidity,
            pump=r.pump_state,
            mode=r.mode or "auto",
            timestamp=r.created_at.isoformat()
        )
        for r in records
    ]

    return {
        "device_id": device_id,
        "count": len(data),
        "data": data
    }

# 4. Device Status
@app.get("/api/device/status", response_model=DeviceStatusResponse)
def get_device_status(device_id: str = Query("AGRO_001"), db: Session = Depends(get_db)):
    device = db.query(Device).filter(Device.device_id == device_id).first()
    config = db.query(DeviceConfig).filter(DeviceConfig.device_id == device_id).first()
    latest = db.query(Telemetry).filter(Telemetry.device_id == device_id).order_by(Telemetry.id.desc()).first()

    return {
        "device_id": device_id,
        "name": device.name if device else "AgroVerse Node",
        "is_online": True,
        "last_seen": device.last_seen.isoformat() if device and device.last_seen else None,
        "firmware_version": device.firmware_version if device else "1.0.0",
        "ip_address": device.ip_address if device else "192.168.1.145",
        "current_mode": config.mode if config else "auto",
        "confirmed_pump_state": latest.pump_state if latest else False,
        "pending_pump_command": config.pending_pump_command if config else None,
        "rssi": latest.rssi if latest else -62,
        "seconds_since_last_seen": 2
    }

# 5. Irrigation Control
@app.post("/api/irrigation/control", response_model=IrrigationControlResponse)
def control_irrigation(req: IrrigationControlRequest, db: Session = Depends(get_db)):
    config = db.query(DeviceConfig).filter(DeviceConfig.device_id == req.device_id).first()
    if config:
        config.pending_pump_command = req.command
        config.command_issued_at = datetime.datetime.utcnow()

    # Log event
    event = IrrigationEvent(
        device_id=req.device_id,
        event_type="start" if req.command else "stop",
        triggered_by="manual_dashboard",
        duration_seconds=req.duration_seconds,
        water_volume_liters=6.2 if req.command else None,
        created_at=datetime.datetime.utcnow()
    )
    db.add(event)
    db.commit()

    # Broadcast update
    manager.broadcast_sync({
        "type": "pump_state_change",
        "data": {
            "device_id": req.device_id,
            "pump": req.command,
            "triggered_by": "manual_dashboard",
            "timestamp": datetime.datetime.utcnow().isoformat()
        }
    })

    return {
        "status": "success",
        "message": f"Pump command ({'ON' if req.command else 'OFF'}) queued for device",
        "device_id": req.device_id,
        "requested_state": req.command,
        "confirmed_state": req.command,
        "mode": config.mode if config else "manual",
        "safety_timer_seconds": req.duration_seconds or 600,
        "timestamp": datetime.datetime.utcnow().isoformat()
    }

# 6. Mode & Threshold Configuration
@app.post("/api/irrigation/mode")
def set_irrigation_mode(req: IrrigationModeRequest, db: Session = Depends(get_db)):
    config = db.query(DeviceConfig).filter(DeviceConfig.device_id == req.device_id).first()
    if not config:
        config = DeviceConfig(device_id=req.device_id)
        db.add(config)

    config.mode = req.mode
    if req.moisture_threshold_low is not None:
        config.moisture_threshold_low = req.moisture_threshold_low
    if req.moisture_threshold_high is not None:
        config.moisture_threshold_high = req.moisture_threshold_high

    db.commit()
    return {
        "status": "success",
        "message": f"Operating mode set to {req.mode}",
        "device_id": req.device_id
    }

# 7. Irrigation History
@app.get("/api/irrigation/history", response_model=IrrigationHistoryResponse)
def get_irrigation_history(device_id: str = Query("AGRO_001"), db: Session = Depends(get_db)):
    events = db.query(IrrigationEvent).filter(IrrigationEvent.device_id == device_id).order_by(IrrigationEvent.created_at.desc()).limit(50).all()
    items = [
        IrrigationEventItem(
            id=e.id,
            device_id=e.device_id,
            event_type=e.event_type,
            triggered_by=e.triggered_by,
            duration_seconds=e.duration_seconds,
            water_volume_liters=e.water_volume_liters,
            moisture_before=e.moisture_before,
            moisture_after=e.moisture_after,
            timestamp=e.created_at.isoformat()
        )
        for e in events
    ]
    return {
        "device_id": device_id,
        "total_events": len(items),
        "events": items
    }

# 8. AI Insights / Recommendation Engine
@app.get("/api/ai/insights", response_model=AIPredictionResponse)
def get_ai_insights(device_id: str = Query("AGRO_001"), db: Session = Depends(get_db)):
    latest = db.query(Telemetry).filter(Telemetry.device_id == device_id).order_by(Telemetry.id.desc()).first()
    config = db.query(DeviceConfig).filter(DeviceConfig.device_id == device_id).first()

    m = latest.soil_moisture if latest else 34.2
    low_th = config.moisture_threshold_low if config else 30.0
    t = latest.temperature if latest else 28.6
    h = latest.humidity if latest else 62.4

    req = m < low_th
    return {
        "irrigation_required": req,
        "priority": "critical" if m < 20 else ("high" if req else "low"),
        "confidence": 0.94,
        "reason": f"Soil moisture is at {m}%. {'Below threshold of ' + str(low_th) + '%. Irrigation required to prevent root dehydration.' if req else 'Within optimal vegetative buffer. No water required.'}",
        "suggested_duration_seconds": 240 if req else None,
        "soil_trend": "slowly_drying",
        "model_type": "rule_based_engine_v1",
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "metrics_snapshot": {
            "soil_moisture": m,
            "temperature": t,
            "humidity": h
        }
    }

# 9. Conversational AI Chat
@app.post("/api/ai/chat", response_model=AIChatResponse)
def ai_chat(req: AIChatRequest, db: Session = Depends(get_db)):
    device_id = req.device_id or settings.DEFAULT_DEVICE_ID
    latest = db.query(Telemetry).filter(Telemetry.device_id == device_id).order_by(Telemetry.id.desc()).first()
    config = db.query(DeviceConfig).filter(DeviceConfig.device_id == device_id).first()

    farm_context = req.farm_context
    m = farm_context.soil_moisture if farm_context and farm_context.soil_moisture is not None else (latest.soil_moisture if latest else 34.2)
    t = farm_context.temperature if farm_context and farm_context.temperature is not None else (latest.temperature if latest else 28.6)
    h = farm_context.humidity if farm_context and farm_context.humidity is not None else (latest.humidity if latest else 62.4)
    pump = farm_context.pump if farm_context and farm_context.pump is not None else (latest.pump_state if latest else False)

    # Log user prompt
    user_log = AIChatLog(user_id=req.user_id or "farmer_1", role="user", content=req.message)
    db.add(user_log)
    db.commit()

    context_data = {
        "soil_moisture": m,
        "temperature": t,
        "humidity": h,
        "pump": pump,
        "mode": farm_context.mode if farm_context and farm_context.mode else (latest.mode if latest else "auto"),
        "threshold_low": farm_context.threshold_low if farm_context and farm_context.threshold_low is not None else (config.moisture_threshold_low if config else 30.0),
        "threshold_high": farm_context.threshold_high if farm_context and farm_context.threshold_high is not None else (config.moisture_threshold_high if config else 75.0),
        "crop_profile": {
            "crop": farm_context.crop if farm_context else None,
            "growth_stage": farm_context.growth_stage if farm_context else None,
            "cultivation_method": farm_context.cultivation_method if farm_context else None,
            "soil_type": farm_context.soil_type if farm_context else None,
        },
    }

    provider = settings.AI_PROVIDER.strip().lower()
    if provider == "gemini":
        if not settings.GEMINI_API_KEY.strip():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Gemini is selected but GEMINI_API_KEY is not configured in the backend .env file.",
            )
        try:
            reply = generate_gemini_reply(
                api_key=settings.GEMINI_API_KEY,
                model=settings.LLM_MODEL,
                message=req.message,
                farm_context=context_data,
                conversation_history=[
                    {"role": turn.role, "content": turn.content}
                    for turn in req.conversation_history
                ],
            )
        except GeminiTimeoutError as error:
            raise HTTPException(status_code=status.HTTP_504_GATEWAY_TIMEOUT, detail=str(error)) from error
        except GeminiAPIError as error:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(error)) from error
        response_model = settings.LLM_MODEL
    elif provider == "local":
        reply = (
            f"Your current soil moisture is **{m}%** (Threshold: **{context_data['threshold_low']}%**). "
            f"Ambient temperature is **{t}°C** and humidity is **{h}%**. "
            f"Pump status is **{'ON' if pump else 'OFF'}**."
        )
        response_model = "agroverse-edge-ai-v1"
    else:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Unsupported AI_PROVIDER '{settings.AI_PROVIDER}'. Use 'gemini' or 'local'.",
        )

    ai_log = AIChatLog(user_id=req.user_id or "farmer_1", role="assistant", content=reply)
    db.add(ai_log)
    db.commit()

    return {
        "id": ai_log.id,
        "reply": reply,
        "role": "assistant",
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "model": response_model,
        "live_sensor_context": {
            "soil_moisture": m,
            "temperature": t,
            "humidity": h,
            "pump": pump
        },
        "suggested_followups": [
            "Does my farm need irrigation?",
            "Why is my pump currently running?",
            "How much water did my system use today?",
            "What should I consider for my crop and growth stage?"
        ]
    }

# 10. WebSocket for Live Telemetry Stream
@app.websocket("/api/ws/telemetry")
async def websocket_telemetry(websocket: WebSocket, device_id: str = "AGRO_001"):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
