'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  SensorSummary, 
  SensorHistoryRecord, 
  AIPrediction, 
  IrrigationEventRecord, 
  SoilCondition,
  FarmProfile,
} from './types';
import { sendPumpControlCommand } from './api';

interface TelemetryContextType {
  summary: SensorSummary;
  farmProfile: FarmProfile;
  history: SensorHistoryRecord[];
  prediction: AIPrediction;
  events: IrrigationEventRecord[];
  loading: boolean;
  feedData: (data: {
    soil_moisture: number;
    temperature: number;
    humidity: number;
    pump?: boolean;
    mode?: 'auto' | 'manual';
  }) => void;
  updateFarmProfile: (profile: FarmProfile) => void;
  setScenario: (scenarioName: string) => void;
  togglePump: (state?: boolean) => Promise<void>;
  updateThresholds: (low: number, high: number) => void;
  setOperatingMode: (mode: 'auto' | 'manual') => void;
  clearHistory: () => void;
}

const STORAGE_KEY_SUMMARY = 'agroverse_fed_summary_v1';
const STORAGE_KEY_HISTORY = 'agroverse_fed_history_v1';
const STORAGE_KEY_EVENTS = 'agroverse_fed_events_v1';
const STORAGE_KEY_FARM_PROFILE = 'agroverse_farm_profile_v1';

const initialFarmProfile: FarmProfile = {
  crop: '',
  growth_stage: '',
  cultivation_method: '',
  soil_type: '',
};

// Initial baseline realistic dataset
const initialSummary: SensorSummary = {
  soil_moisture: {
    current: 34.2,
    status: 'optimal',
    threshold_low: 30.0,
    threshold_high: 75.0,
    unit: '%',
  },
  temperature: {
    current: 28.6,
    status: 'optimal',
    unit: '°C',
  },
  humidity: {
    current: 62.4,
    status: 'optimal',
    unit: '%',
  },
  pump: {
    state: false,
    mode: 'auto',
    last_activated: new Date(Date.now() - 3600000 * 2.5).toISOString(),
    total_duration_today_sec: 420,
    estimated_water_liters_today: 18.5,
  },
  device: {
    device_id: 'AGRO_MANUAL_NODE',
    name: 'AgroVerse Direct Data Feeder',
    is_online: true,
    last_seen: new Date().toISOString(),
    firmware_version: 'WebFeed v1.0',
    ip_address: '127.0.0.1 (Web Interface)',
    mac_address: 'WEB:DATA:FEED:01',
  },
  last_updated: new Date().toISOString(),
};

function generateInitialHistory(): SensorHistoryRecord[] {
  const points: SensorHistoryRecord[] = [];
  const now = Date.now();
  for (let i = 24; i >= 0; i--) {
    const timestamp = new Date(now - i * 3600 * 1000).toISOString();
    const moisture = Math.max(18, Math.min(85, Number((38 - (i % 7) * 2.2 + Math.random() * 2).toFixed(1))));
    const temp = Number((24 + Math.sin(i / 3) * 6 + Math.random()).toFixed(1));
    const hum = Number((60 - Math.sin(i / 3) * 15 + Math.random() * 2).toFixed(1));
    points.push({
      id: 25 - i,
      device_id: 'AGRO_MANUAL_NODE',
      soil_moisture: moisture,
      temperature: temp,
      humidity: hum,
      pump: moisture < 30,
      timestamp,
    });
  }
  return points;
}

function computeAIPrediction(summary: SensorSummary, history: SensorHistoryRecord[]): AIPrediction {
  const m = summary.soil_moisture.current;
  const t = summary.temperature.current;
  const h = summary.humidity.current;
  const lowThresh = summary.soil_moisture.threshold_low;
  const highThresh = summary.soil_moisture.threshold_high;

  let required = false;
  let priority: 'low' | 'medium' | 'high' | 'critical' = 'low';
  let confidence = 0.94;
  let reason = '';
  let suggestedDuration: number | null = null;
  let soilTrend: 'rapidly_drying' | 'slowly_drying' | 'stable' | 'increasing' = 'stable';

  // Check history trend if we have at least 2 points
  if (history.length >= 2) {
    const last = history[history.length - 1].soil_moisture;
    const prev = history[history.length - 2].soil_moisture;
    const delta = last - prev;
    if (delta < -3) soilTrend = 'rapidly_drying';
    else if (delta < 0) soilTrend = 'slowly_drying';
    else if (delta > 2) soilTrend = 'increasing';
  }

  if (m < lowThresh) {
    required = true;
    if (m < 20) {
      priority = 'critical';
      confidence = 0.98;
      suggestedDuration = 360;
      reason = `Critical drought stress: Soil moisture is at ${m}%, well below safe threshold (${lowThresh}%). High ambient temperature (${t}°C) will accelerate root desiccation. Immediate irrigation required.`;
    } else {
      priority = 'high';
      confidence = 0.92;
      suggestedDuration = 240;
      reason = `Moisture depleted: Soil moisture (${m}%) is below configured threshold (${lowThresh}%). Irrigation is recommended to replenish root zone water content.`;
    }
  } else if (m > highThresh) {
    required = false;
    priority = 'low';
    confidence = 0.96;
    reason = `Over-saturated soil: Moisture is at ${m}%, exceeding ${highThresh}%. Avoid irrigation to prevent root rot and anaerobic soil conditions.`;
  } else {
    required = false;
    priority = 'low';
    confidence = 0.91;
    reason = `Optimal condition: Moisture is well-balanced at ${m}% (healthy range: ${lowThresh}% - ${highThresh}%). Transpiration rate is manageable with ambient temperature at ${t}°C and humidity at ${h}%.`;
  }

  return {
    irrigation_required: required,
    priority,
    confidence,
    reason,
    suggested_duration_seconds: suggestedDuration,
    soil_trend: soilTrend,
    model_type: 'rule_based_engine_v1',
    timestamp: new Date().toISOString(),
  };
}

const TelemetryContext = createContext<TelemetryContextType | null>(null);

export const TelemetryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [summary, setSummary] = useState<SensorSummary>(initialSummary);
  const [farmProfile, setFarmProfile] = useState<FarmProfile>(initialFarmProfile);
  const [history, setHistory] = useState<SensorHistoryRecord[]>([]);
  const [events, setEvents] = useState<IrrigationEventRecord[]>([]);
  const [prediction, setPrediction] = useState<AIPrediction>(() => computeAIPrediction(initialSummary, []));
  const [loading, setLoading] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedSum = localStorage.getItem(STORAGE_KEY_SUMMARY);
      const savedHist = localStorage.getItem(STORAGE_KEY_HISTORY);
      const savedEvts = localStorage.getItem(STORAGE_KEY_EVENTS);
      const savedFarmProfile = localStorage.getItem(STORAGE_KEY_FARM_PROFILE);

      let currentSum = initialSummary;
      let currentHist = generateInitialHistory();

      if (savedFarmProfile) {
        setFarmProfile({ ...initialFarmProfile, ...JSON.parse(savedFarmProfile) });
      }
      if (savedSum) {
        currentSum = JSON.parse(savedSum);
        setSummary(currentSum);
      }
      if (savedHist) {
        currentHist = JSON.parse(savedHist);
        setHistory(currentHist);
      } else {
        setHistory(currentHist);
        localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(currentHist));
      }
      if (savedEvts) {
        setEvents(JSON.parse(savedEvts));
      } else {
        const defaultEvts: IrrigationEventRecord[] = [
          {
            id: 'evt_1',
            device_id: 'AGRO_MANUAL_NODE',
            event_type: 'stop',
            triggered_by: 'auto_threshold',
            duration_seconds: 180,
            water_volume_liters: 7.2,
            moisture_before: 26.5,
            moisture_after: 42.0,
            timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
          },
        ];
        setEvents(defaultEvts);
      }

      setPrediction(computeAIPrediction(currentSum, currentHist));
    } catch (e) {
      console.warn('Could not restore fed data from storage:', e);
    }
  }, []);

  const updateFarmProfile = useCallback((profile: FarmProfile) => {
    setFarmProfile(profile);
    try {
      localStorage.setItem(STORAGE_KEY_FARM_PROFILE, JSON.stringify(profile));
    } catch (error) {
      console.warn('Could not save farm profile:', error);
    }
  }, []);

  const feedData = useCallback((data: {
    soil_moisture: number;
    temperature: number;
    humidity: number;
    pump?: boolean;
    mode?: 'auto' | 'manual';
  }) => {
    setSummary((prev) => {
      const now = new Date().toISOString();
      const m = Math.max(0, Math.min(100, data.soil_moisture));
      const t = data.temperature;
      const h = Math.max(0, Math.min(100, data.humidity));
      
      const condition: SoilCondition = m < prev.soil_moisture.threshold_low 
        ? 'dry' 
        : m > prev.soil_moisture.threshold_high 
          ? 'wet' 
          : 'optimal';

      // Auto mode: if moisture < threshold, auto turn ON pump
      let autoPump = prev.pump.state;
      const opMode = data.mode ?? prev.pump.mode;
      if (opMode === 'auto') {
        autoPump = m < prev.soil_moisture.threshold_low;
      } else if (data.pump !== undefined) {
        autoPump = data.pump;
      }

      const updatedSum: SensorSummary = {
        ...prev,
        soil_moisture: {
          ...prev.soil_moisture,
          current: m,
          status: condition,
        },
        temperature: {
          ...prev.temperature,
          current: t,
          status: t > 32 ? 'hot' : t < 18 ? 'cold' : 'optimal',
        },
        humidity: {
          ...prev.humidity,
          current: h,
          status: h < 40 ? 'low' : h > 80 ? 'high' : 'optimal',
        },
        pump: {
          ...prev.pump,
          state: autoPump,
          mode: opMode,
          last_activated: autoPump ? now : prev.pump.last_activated,
          total_duration_today_sec: autoPump 
            ? prev.pump.total_duration_today_sec + 60 
            : prev.pump.total_duration_today_sec,
          estimated_water_liters_today: autoPump 
            ? Number((prev.pump.estimated_water_liters_today + 2.5).toFixed(1)) 
            : prev.pump.estimated_water_liters_today,
        },
        last_updated: now,
      };

      // Add to history
      setHistory((prevHist) => {
        const newRecord: SensorHistoryRecord = {
          id: prevHist.length + 1,
          device_id: prev.device.device_id,
          soil_moisture: m,
          temperature: t,
          humidity: h,
          pump: autoPump,
          timestamp: now,
        };
        const newHist = [...prevHist.slice(-29), newRecord];
        try {
          localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(newHist));
        } catch (_) {}
        
        // Re-calculate AI prediction
        setPrediction(computeAIPrediction(updatedSum, newHist));
        return newHist;
      });

      // If pump changed state, log an irrigation event
      if (autoPump !== prev.pump.state) {
        setEvents((prevEvts) => {
          const newEvt: IrrigationEventRecord = {
            id: 'evt_' + Date.now(),
            device_id: prev.device.device_id,
            event_type: autoPump ? 'start' : 'stop',
            triggered_by: opMode === 'auto' ? 'auto_threshold' : 'manual_dashboard',
            duration_seconds: autoPump ? 180 : undefined,
            water_volume_liters: autoPump ? 6.5 : undefined,
            moisture_before: prev.soil_moisture.current,
            moisture_after: m,
            timestamp: now,
          };
          const updatedEvts = [newEvt, ...prevEvts.slice(0, 19)];
          try {
            localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(updatedEvts));
          } catch (_) {}
          return updatedEvts;
        });
      }

      try {
        localStorage.setItem(STORAGE_KEY_SUMMARY, JSON.stringify(updatedSum));
      } catch (_) {}

      // Background synchronization with FastAPI backend (silent non-blocking)
      try {
        fetch('http://127.0.0.1:8000/api/telemetry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            device_id: 'AGRO_001',
            soil_moisture: m,
            temperature: t,
            humidity: h,
            pump: autoPump,
            mode: opMode,
            timestamp: now,
          }),
        }).catch(() => {});
      } catch (_) {}

      return updatedSum;
    });
  }, []);

  const setScenario = useCallback((scenarioName: string) => {
    switch (scenarioName) {
      case 'drought':
        feedData({ soil_moisture: 18.4, temperature: 35.8, humidity: 24.0, mode: 'auto' });
        break;
      case 'optimal':
        feedData({ soil_moisture: 48.0, temperature: 24.5, humidity: 62.0, mode: 'auto' });
        break;
      case 'saturated':
        feedData({ soil_moisture: 82.5, temperature: 21.0, humidity: 85.0, mode: 'auto' });
        break;
      case 'heatwave':
        feedData({ soil_moisture: 27.2, temperature: 39.5, humidity: 19.0, mode: 'auto' });
        break;
      case 'irrigating':
        feedData({ soil_moisture: 25.0, temperature: 29.0, humidity: 45.0, pump: true, mode: 'manual' });
        break;
    }
  }, [feedData]);

  const togglePump = useCallback(async (desiredState?: boolean) => {
    setSummary((prev) => {
      const now = new Date().toISOString();
      const newState = desiredState !== undefined ? desiredState : !prev.pump.state;
      const updated: SensorSummary = {
        ...prev,
        pump: {
          ...prev.pump,
          state: newState,
          last_activated: newState ? now : prev.pump.last_activated,
          total_duration_today_sec: newState ? prev.pump.total_duration_today_sec + 60 : prev.pump.total_duration_today_sec,
          estimated_water_liters_today: newState ? Number((prev.pump.estimated_water_liters_today + 2.5).toFixed(1)) : prev.pump.estimated_water_liters_today,
        },
        last_updated: now,
      };

      setEvents((prevEvts) => {
        const newEvt: IrrigationEventRecord = {
          id: 'evt_' + Date.now(),
          device_id: prev.device.device_id,
          event_type: newState ? 'start' : 'stop',
          triggered_by: 'manual_dashboard',
          duration_seconds: newState ? 120 : undefined,
          water_volume_liters: newState ? 4.8 : undefined,
          moisture_before: prev.soil_moisture.current,
          timestamp: now,
        };
        const updatedEvts = [newEvt, ...prevEvts.slice(0, 19)];
        try {
          localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(updatedEvts));
        } catch (_) {}
        return updatedEvts;
      });

      try {
        localStorage.setItem(STORAGE_KEY_SUMMARY, JSON.stringify(updated));
      } catch (_) {}

      // Background sync to backend
      try {
        fetch('http://127.0.0.1:8000/api/irrigation/control', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            device_id: 'AGRO_001',
            command: newState,
            reason: 'Manual dashboard control',
          }),
        }).catch(() => {});
      } catch (_) {}

      return updated;
    });
  }, []);

  const updateThresholds = useCallback((low: number, high: number) => {
    setSummary((prev) => {
      const updated: SensorSummary = {
        ...prev,
        soil_moisture: {
          ...prev.soil_moisture,
          threshold_low: low,
          threshold_high: high,
        },
      };
      try {
        localStorage.setItem(STORAGE_KEY_SUMMARY, JSON.stringify(updated));
      } catch (_) {}

      try {
        fetch('http://127.0.0.1:8000/api/irrigation/mode', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            device_id: 'AGRO_001',
            mode: prev.pump.mode,
            moisture_threshold_low: low,
            moisture_threshold_high: high,
          }),
        }).catch(() => {});
      } catch (_) {}

      setPrediction(computeAIPrediction(updated, history));
      return updated;
    });
  }, [history]);

  const setOperatingMode = useCallback((mode: 'auto' | 'manual') => {
    setSummary((prev) => {
      const updated: SensorSummary = {
        ...prev,
        pump: {
          ...prev.pump,
          mode,
        },
      };
      try {
        localStorage.setItem(STORAGE_KEY_SUMMARY, JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    const initial = generateInitialHistory();
    setHistory(initial);
    setEvents([]);
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(initial));
      localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify([]));
    } catch (_) {}
  }, []);

  return (
    <TelemetryContext.Provider value={{
      summary,
      farmProfile,
      history,
      prediction,
      events,
      loading,
      feedData,
      updateFarmProfile,
      setScenario,
      togglePump,
      updateThresholds,
      setOperatingMode,
      clearHistory,
    }}>
      {children}
    </TelemetryContext.Provider>
  );
};

export const useFedTelemetry = () => {
  const ctx = useContext(TelemetryContext);
  if (!ctx) {
    throw new Error('useFedTelemetry must be used within a TelemetryProvider');
  }
  return ctx;
};
