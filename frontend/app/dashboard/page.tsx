'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Sprout, 
  Droplets, 
  Thermometer, 
  Wind, 
  Power, 
  RefreshCw, 
  Box, 
  AlertTriangle,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { useTelemetry } from '@/hooks/useTelemetry';
import { useAuth } from '@/hooks/useAuth';
import { SensorCard } from '@/components/dashboard/SensorCard';
import { SensorTrendChart } from '@/components/dashboard/SensorTrendChart';
import { AIPredictionCard } from '@/components/dashboard/AIPredictionCard';
import { ActivityTimeline } from '@/components/dashboard/ActivityTimeline';
import { DailyConsumptionCard } from '@/components/dashboard/DailyConsumptionCard';
import { SensorDataFeeder } from '@/components/dashboard/SensorDataFeeder';
import { formatRelativeTime } from '@/lib/utils';

export default function DashboardOverviewPage() {
  const { user } = useAuth();
  const { summary, history, prediction, events, loading, refresh } = useTelemetry();

  const moisture = summary?.soil_moisture?.current ?? 34.2;
  const moistureStatus = summary?.soil_moisture?.status ?? 'optimal';
  const temp = summary?.temperature?.current ?? 28.6;
  const tempStatus = temp > 32 ? 'hot' : temp < 18 ? 'cold' : 'optimal';
  const humidity = summary?.humidity?.current ?? 62.4;
  const humidityStatus = humidity < 40 ? 'low' : humidity > 80 ? 'high' : 'optimal';
  const pumpState = summary?.pump?.state ?? false;
  const pumpMode = summary?.pump?.mode ?? 'auto';

  const isAbnormalMoisture = moisture < 30;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Welcome & Node Sync Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Agricultural Command Center
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Live Edge Sync
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Monitoring <strong className="text-zinc-200">{user?.farm_name || 'AgroVerse Precision Farm #1'}</strong> · Node ID:{' '}
            <span className="font-mono text-emerald-400">{summary?.device?.device_id || 'AGRO_001'}</span>
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => refresh()}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] text-xs font-mono text-zinc-300 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${loading ? 'animate-spin' : ''}`} />
            <span>Poll Telemetry</span>
          </button>

          <Link
            href="/dashboard/farm"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white font-medium text-xs shadow-glow transition-all"
          >
            <Box className="w-3.5 h-3.5" />
            <span>Launch 3D Digital Twin</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Quick Telemetry Feeder / Simulator */}
      <SensorDataFeeder />

      {/* Critical Alert Banner if Moisture is below threshold */}
      {isAbnormalMoisture && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h4 className="text-xs font-bold font-mono uppercase text-amber-200">
                Low Soil Moisture Warning · Threshold Tripped
              </h4>
              <p className="text-xs text-amber-300/80 mt-0.5">
                Volumetric water content dropped to {moisture}% (threshold setpoint is 30.0%). Automatic solenoid actuator is queued for hydration cycle.
              </p>
            </div>
          </div>

          <Link
            href="/dashboard/irrigation"
            className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-xs font-mono font-medium text-amber-200 border border-amber-500/40 transition-colors shrink-0"
          >
            Inspect Valve Controls &rarr;
          </Link>
        </div>
      )}

      {/* 4 PRIMARY SENSOR CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Soil Moisture */}
        <SensorCard
          type="moisture"
          value={moisture}
          unit="%"
          statusText={moistureStatus === 'dry' ? 'Dry (Alert)' : moistureStatus === 'wet' ? 'Saturated' : 'Optimal'}
          statusColor={moistureStatus === 'dry' ? 'amber' : moistureStatus === 'wet' ? 'blue' : 'emerald'}
          trendDirection={moisture < 30 ? 'down' : 'stable'}
          trendValue={moisture < 30 ? '-2.4%/hr' : 'Stable'}
          subtext="Capacitive Sensor Pin A0"
        />

        {/* 2. Temperature */}
        <SensorCard
          type="temperature"
          value={temp}
          unit="°C"
          statusText={tempStatus === 'hot' ? 'Elevated' : tempStatus === 'cold' ? 'Chilly' : 'Optimal'}
          statusColor={tempStatus === 'hot' ? 'amber' : 'emerald'}
          trendDirection="stable"
          trendValue="+0.3°C"
          subtext="DHT22 Digital Sensor"
        />

        {/* 3. Humidity */}
        <SensorCard
          type="humidity"
          value={humidity}
          unit="%"
          statusText={humidityStatus === 'low' ? 'Arid' : humidityStatus === 'high' ? 'High' : 'Optimal'}
          statusColor={humidityStatus === 'low' ? 'amber' : 'emerald'}
          trendDirection="stable"
          trendValue="-0.8%"
          subtext="Ambient RH Probe"
        />

        {/* 4. Irrigation / Pump Status */}
        <SensorCard
          type="pump"
          value={pumpState}
          statusText={pumpState ? 'Relay Closed' : 'Relay Open'}
          statusColor={pumpState ? 'emerald' : 'zinc'}
          subtext="Submersible DC Pump"
          meta={{
            mode: pumpMode,
            lastTime: formatRelativeTime(summary?.pump?.last_activated),
            duration: `${Math.round((summary?.pump?.total_duration_today_sec ?? 420) / 60)} mins`,
          }}
        />
      </div>

      {/* MID-LEVEL ANALYTICS & AI PREDICTION GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 2 Columns: Historical Sensor Dynamics Chart */}
        <div className="lg:col-span-2">
          <SensorTrendChart data={history} />
        </div>

        {/* 1 Column: AI Prediction Card */}
        <div>
          <AIPredictionCard prediction={prediction} />
        </div>
      </div>

      {/* BOTTOM SECTION: ACTIVITY TIMELINE & WATER CONSUMPTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 2 Columns: Activity Timeline */}
        <div className="lg:col-span-2">
          <ActivityTimeline events={events} />
        </div>

        {/* 1 Column: Daily Water Consumption */}
        <div>
          <DailyConsumptionCard
            litersToday={summary?.pump?.estimated_water_liters_today ?? 18.5}
            runtimeSeconds={summary?.pump?.total_duration_today_sec ?? 420}
          />
        </div>
      </div>
    </div>
  );
}
