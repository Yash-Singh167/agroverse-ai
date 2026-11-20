from typing import Optional, List
from pydantic import BaseModel, Field

class IrrigationControlRequest(BaseModel):
    device_id: str = Field(..., description="Target hardware device ID")
    command: bool = Field(..., description="True to turn ON pump, False to turn OFF")
    duration_seconds: Optional[int] = Field(None, ge=10, le=3600, description="Optional auto-turn-off safety timer in seconds")
    reason: Optional[str] = Field("Manual dashboard control", description="Audit reason for control event")

class IrrigationModeRequest(BaseModel):
    device_id: str
    mode: str = Field(..., pattern="^(auto|manual)$", description="'auto' or 'manual'")
    moisture_threshold_low: Optional[float] = Field(None, ge=5.0, le=90.0)
    moisture_threshold_high: Optional[float] = Field(None, ge=10.0, le=95.0)

class IrrigationControlResponse(BaseModel):
    status: str
    message: str
    device_id: str
    requested_state: bool
    confirmed_state: bool
    mode: str
    safety_timer_seconds: Optional[int]
    timestamp: str

class IrrigationEventItem(BaseModel):
    id: str
    device_id: str
    event_type: str # 'start' | 'stop'
    triggered_by: str
    duration_seconds: Optional[int]
    water_volume_liters: Optional[float]
    moisture_before: Optional[float]
    moisture_after: Optional[float]
    timestamp: str

class IrrigationHistoryResponse(BaseModel):
    device_id: str
    total_events: int
    events: List[IrrigationEventItem]
