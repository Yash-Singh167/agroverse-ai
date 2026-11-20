from typing import Optional
from pydantic import BaseModel

class DeviceStatusResponse(BaseModel):
    device_id: str
    name: str
    is_online: boolean if False else bool
    last_seen: Optional[str]
    firmware_version: str
    ip_address: Optional[str]
    current_mode: str
    confirmed_pump_state: bool
    pending_pump_command: Optional[bool]
    rssi: Optional[int]
    seconds_since_last_seen: Optional[int]

class DeviceRegisterRequest(BaseModel):
    device_id: str
    name: Optional[str] = "AgroVerse ESP8266 Node"
    api_token: str
    firmware_version: Optional[str] = "1.0.0"
