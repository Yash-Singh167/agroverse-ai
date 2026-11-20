export type SoilCondition = 'dry' | 'optimal' | 'wet';

export interface FarmProfile {
  crop: string;
  growth_stage: string;
  cultivation_method: string;
  soil_type: string;
}

export interface TelemetryData {
  device_id: string;
  soil_moisture: number; // percentage 0-100
  temperature: number;   // celsius
  humidity: number;      // percentage 0-100
  pump: boolean;         // true = ON, false = OFF
  mode: 'auto' | 'manual';
  timestamp: string;     // ISO format
  rssi?: number;         // signal strength in dBm
}

export interface DeviceStatus {
  device_id: string;
  name: string;
  is_online: boolean;
  last_seen: string | null;
  firmware_version: string;
  ip_address?: string;
  mac_address?: string;
}

export interface SensorSummary {
  soil_moisture: {
    current: number;
    status: SoilCondition;
    threshold_low: number;
    threshold_high: number;
    unit: string;
  };
  temperature: {
    current: number;
    status: 'cold' | 'optimal' | 'hot';
    unit: string;
  };
  humidity: {
    current: number;
    status: 'low' | 'optimal' | 'high';
    unit: string;
  };
  pump: {
    state: boolean;           // confirmed state from hardware
    target_state?: boolean;   // pending requested state
    mode: 'auto' | 'manual';
    last_activated: string | null;
    total_duration_today_sec: number;
    estimated_water_liters_today: number;
  };
  device: DeviceStatus;
  last_updated: string;
}

export interface SensorHistoryRecord {
  id?: number | string;
  device_id: string;
  soil_moisture: number;
  temperature: number;
  humidity: number;
  pump: boolean;
  timestamp: string;
}

export interface IrrigationEventRecord {
  id: string;
  device_id: string;
  event_type: 'start' | 'stop';
  triggered_by: 'auto_threshold' | 'manual_dashboard' | 'safety_timeout' | 'ai_recommendation';
  duration_seconds?: number;
  water_volume_liters?: number;
  moisture_before?: number;
  moisture_after?: number;
  timestamp: string;
}

export interface AIPrediction {
  irrigation_required: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0.0 - 1.0
  reason: string;
  suggested_duration_seconds: number | null;
  soil_trend: 'rapidly_drying' | 'slowly_drying' | 'stable' | 'increasing';
  model_type: 'rule_based_engine_v1' | 'ml_random_forest_v1';
  timestamp: string;
}

export interface AIChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  model?: string;
  context_snapshot?: {
    soil_moisture: number;
    temperature: number;
    humidity: number;
    pump: boolean;
    is_live: boolean;
  };
}

export interface AIChatApiResponse {
  id: string;
  reply: string;
  model: string;
  timestamp: string;
  live_sensor_context: Record<string, unknown>;
  suggested_followups: string[];
}

export interface FarmPlot {
  id: string;
  name: string;
  crop: string;
  moisture: number;
  condition: SoilCondition;
  isIrrigating: boolean;
  sensorInstalled: boolean;
  position: [number, number, number];
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  farm_name?: string;
  avatar_url?: string;
  device_id?: string;
}
