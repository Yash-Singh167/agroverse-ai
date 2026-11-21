import datetime
import uuid
from sqlalchemy import Column, String, Float, Boolean, Integer, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

class Device(Base):
    __tablename__ = "devices"

    device_id = Column(String(50), primary_key=True, index=True)
    name = Column(String(100), default="AgroVerse ESP8266 Node #1")
    api_token = Column(String(128), nullable=False) # Device authentication key
    is_online = Column(Boolean, default=False)
    last_seen = Column(DateTime, nullable=True)
    firmware_version = Column(String(20), default="1.0.0")
    ip_address = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    telemetry = relationship("Telemetry", back_populates="device", cascade="all, delete-orphan")
    events = relationship("IrrigationEvent", back_populates="device", cascade="all, delete-orphan")
    config = relationship("DeviceConfig", back_populates="device", uselist=False, cascade="all, delete-orphan")

class Telemetry(Base):
    __tablename__ = "telemetry"

    id = Column(Integer, primary_key=True, autoincrement=True)
    device_id = Column(String(50), ForeignKey("devices.device_id"), index=True)
    soil_moisture = Column(Float, nullable=False) # 0.0 - 100.0%
    temperature = Column(Float, nullable=False)   # Celsius
    humidity = Column(Float, nullable=False)      # 0.0 - 100.0%
    pump_state = Column(Boolean, default=False)   # Hardware confirmed pump state
    mode = Column(String(20), default="auto")     # 'auto' or 'manual'
    rssi = Column(Integer, nullable=True)         # Signal strength
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    device = relationship("Device", back_populates="telemetry")

class IrrigationEvent(Base):
    __tablename__ = "irrigation_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    device_id = Column(String(50), ForeignKey("devices.device_id"), index=True)
    event_type = Column(String(20), nullable=False) # 'start' | 'stop'
    triggered_by = Column(String(50), nullable=False) # 'auto_threshold', 'manual_dashboard', 'safety_timeout', 'ai_recommendation'
    duration_seconds = Column(Integer, nullable=True)
    water_volume_liters = Column(Float, nullable=True)
    moisture_before = Column(Float, nullable=True)
    moisture_after = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    device = relationship("Device", back_populates="events")

class DeviceConfig(Base):
    __tablename__ = "device_configs"

    device_id = Column(String(50), ForeignKey("devices.device_id"), primary_key=True)
    moisture_threshold_low = Column(Float, default=30.0)
    moisture_threshold_high = Column(Float, default=75.0)
    mode = Column(String(20), default="auto") # 'auto' or 'manual'
    pending_pump_command = Column(Boolean, nullable=True) # None = no command, True = turn ON, False = turn OFF
    command_issued_at = Column(DateTime, nullable=True)
    max_continuous_runtime_sec = Column(Integer, default=600)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    device = relationship("Device", back_populates="config")

class AIChatLog(Base):
    __tablename__ = "ai_chat_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(100), default="default_farmer", index=True)
    role = Column(String(20), nullable=False) # 'user' | 'assistant'
    content = Column(Text, nullable=False)
    context_snapshot = Column(Text, nullable=True) # JSON snapshot of sensor values during generation
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
