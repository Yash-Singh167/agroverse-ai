from typing import Optional, List, Dict, Any, Literal
from pydantic import BaseModel, Field

class AIChatTurn(BaseModel):
    role: Literal["user", "model"]
    content: str = Field(..., min_length=1, max_length=2000)

class AIChatFarmContext(BaseModel):
    soil_moisture: Optional[float] = None
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    pump: Optional[bool] = None
    mode: Optional[str] = None
    threshold_low: Optional[float] = None
    threshold_high: Optional[float] = None
    crop: Optional[str] = Field(None, max_length=100)
    growth_stage: Optional[str] = Field(None, max_length=100)
    cultivation_method: Optional[str] = Field(None, max_length=200)
    soil_type: Optional[str] = Field(None, max_length=100)

class AIChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000, description="User question or command")
    device_id: Optional[str] = Field("AGRO_001", description="Device context to consult")
    user_id: Optional[str] = Field("farmer_1", description="User identifier")
    farm_context: Optional[AIChatFarmContext] = None
    conversation_history: List[AIChatTurn] = Field(default_factory=list, max_length=12)

class AIChatResponse(BaseModel):
    id: str
    reply: str
    role: str = "assistant"
    timestamp: str
    model: str
    live_sensor_context: Dict[str, Any]
    suggested_followups: List[str]

class AIPredictionResponse(BaseModel):
    irrigation_required: bool
    priority: str # 'low', 'medium', 'high', 'critical'
    confidence: float # 0.0 - 1.0
    reason: str
    suggested_duration_seconds: Optional[int]
    soil_trend: str # 'rapidly_drying', 'slowly_drying', 'stable', 'increasing'
    model_type: str # 'rule_based_engine_v1'
    timestamp: str
    metrics_snapshot: Dict[str, Any]
