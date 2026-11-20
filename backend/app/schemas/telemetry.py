import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

class TelemetryPayload(BaseModel):
    device_id: str = Field(..., description="Unique hardware identifier, e.g. AGRO_001")
    soil_moisture: float = Field(..., ge=0.0, le=100.0, description="Soil moisture percentage")
    temperature: float = Field(..., ge=-40.0, le=80.0, description="Temperature in Celsius")
    humidity: float = Field(..., ge=0.0, le=100.0, description="Relative humidity percentage")
    pump: bool = Field(..., description="Confirmed hardware relay pump status: True=ON, False=OFF")
    mode: Optional[str] = Field("auto", description="Current operating mode: 'auto' | 'manual'")
    timestamp: Optional[str] = Field(None, description="ISO timestamp from device or will be server-assigned")
    rssi: Optional[int] = Field(None, description="WiFi RSSI in dBm")

class TelemetryResponse(BaseModel):
    status: str
    message: str
    device_id: str
    server_time: str
    pending_command: Optional[bool] = None # Allows ESP8266 to receive pump command piggybacked on telemetry POST response

class SensorLatestResponse(BaseModel):
    soil_moisture: dict
    temperature: dict
    humidity: dict
    pump: dict
    device: dict
    last_updated: str

class SensorHistoryPoint(BaseModel):
    id: int
    device_id: str
    soil_moisture: float
    temperature: float
    humidity: float
    pump: bool
    mode: str
    timestamp: str

class HistoryFilterResponse(BaseModel):
    device_id: str
    count: int
    data: List[SensorHistoryPoint]
