'use client';

import React, { useState } from 'react';
import { FarmCanvas } from '@/components/farm-3d/FarmCanvas';
import { useTelemetry } from '@/hooks/useTelemetry';
import { 
  Sprout, 
  Droplets, 
  Thermometer, 
  Wind, 
  Power, 
  Radio, 
  Info, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LiveFarm3DPage() {
  const { summary, controlPump } = useTelemetry();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const moisture = summary?.soil_moisture?.current ?? 34.2;
  const temp = summary?.temperature?.current ?? 28.6;
  const humidity = summary?.humidity?.current ?? 62.4;
  const pumpActive = summary?.pump?.state ?? false;

  const handleTogglePump = async () => {
    setIsSubmitting(true);
    try {
      await controlPump(!pumpActive, 120);
    } catch (err) {
      console.error('Failed to toggle pump', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Live 3D Agricultural Digital Twin
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Interactive WebGL
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time physical hydrological simulation synchronized with ESP8266 node telemetry.
          </p>
        </div>

        {/* Live Actuator State Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs font-mono">
            <span className={cn('w-2 h-2 rounded-full', pumpActive ? 'bg-emerald-400 animate-ping' : 'bg-zinc-500')} />
            <span className="text-zinc-400">Pump Actuator:</span>
            <span className={cn('font-bold', pumpActive ? 'text-emerald-400' : 'text-zinc-300')}>
              {pumpActive ? 'SPRAYING WATER' : 'STANDBY (OFF)'}
            </span>
          </div>
        </div>
      </div>

      {/* Main 3D Canvas Card */}
      <FarmCanvas
        pumpActive={pumpActive}
        onTogglePump={handleTogglePump}
        liveMoisture={moisture}
        liveTemp={temp}
        liveHumidity={humidity}
      />

      {/* Bottom Visual Legend & Telemetry Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Soil Moisture Color Map Card */}
        <div className="p-4 rounded-xl bg-[#0f1712]/70 border border-white/[0.08] text-xs font-mono">
          <div className="flex items-center gap-2 text-zinc-300 font-semibold mb-3 uppercase tracking-wider">
            <Info className="w-3.5 h-3.5 text-emerald-400" />
            <span>Soil Shading Logic</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#945d31] border border-white/20" />
                <span className="text-zinc-400">Arid Soil (&lt;30%)</span>
              </div>
              <span className="text-amber-400 font-bold">Dry Clay</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#433022] border border-white/20" />
                <span className="text-zinc-400">Optimal (30-75%)</span>
              </div>
              <span className="text-emerald-400 font-bold">Fertile Loam</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#253f47] border border-white/20" />
                <span className="text-zinc-400">Saturated (&gt;75%)</span>
              </div>
              <span className="text-sky-400 font-bold">Waterlogged</span>
            </div>
          </div>
        </div>

        {/* Live Soil Moisture Telemetry */}
        <div className="p-4 rounded-xl bg-[#0f1712]/70 border border-white/[0.08] text-xs font-mono flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="flex items-center gap-1.5 uppercase tracking-wider">
              <Droplets className="w-3.5 h-3.5 text-emerald-400" /> Plot A Probe
            </span>
            <span className="text-emerald-400">A0 Analog</span>
          </div>
          <div className="my-2">
            <div className="text-2xl font-bold font-mono text-white">{moisture}%</div>
            <div className="text-[11px] text-zinc-400">Volumetric Water Content</div>
          </div>
          <div className="text-[10px] text-zinc-500">Threshold trigger set at 30.0%</div>
        </div>

        {/* Ambient DHT22 Environment */}
        <div className="p-4 rounded-xl bg-[#0f1712]/70 border border-white/[0.08] text-xs font-mono flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="flex items-center gap-1.5 uppercase tracking-wider">
              <Thermometer className="w-3.5 h-3.5 text-amber-400" /> Climate Probe
            </span>
            <span className="text-zinc-400">DHT22</span>
          </div>
          <div className="my-2 flex items-baseline gap-3">
            <div>
              <div className="text-2xl font-bold font-mono text-white">{temp}°C</div>
              <div className="text-[10px] text-zinc-400">Air Temp</div>
            </div>
            <div className="border-l border-white/[0.08] pl-3">
              <div className="text-2xl font-bold font-mono text-white">{humidity}%</div>
              <div className="text-[10px] text-zinc-400">Humidity</div>
            </div>
          </div>
          <div className="text-[10px] text-zinc-500">Transpiration index: Moderate</div>
        </div>

        {/* Quick Manual Actuation Control */}
        <div className="p-4 rounded-xl bg-[#0f1712]/70 border border-white/[0.08] text-xs font-mono flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="flex items-center gap-1.5 uppercase tracking-wider">
              <Power className="w-3.5 h-3.5 text-emerald-400" /> Solenoid Pump
            </span>
            <span className="text-zinc-400">12V Relay</span>
          </div>
          <div className="my-2">
            <button
              onClick={handleTogglePump}
              disabled={isSubmitting}
              className={cn(
                'w-full py-2 px-3 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer',
                pumpActive
                  ? 'bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30'
                  : 'bg-emerald-600/90 hover:bg-emerald-500 text-white shadow-glow'
              )}
            >
              {pumpActive ? 'Stop Sprinklers' : 'Start Water Spray'}
            </button>
          </div>
          <div className="text-[10px] text-zinc-500">Simulates real-time physical water flow</div>
        </div>
      </div>
    </div>
  );
}
