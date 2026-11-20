'use client';

import React, { useEffect, useState } from 'react';
import { 
  Sliders, 
  Droplets, 
  Thermometer, 
  Wind, 
  Power, 
  Sparkles, 
  CheckCircle2, 
  Cpu, 
  RotateCcw,
  Sun,
  CloudRain,
  Flame,
  Check,
  Sprout
} from 'lucide-react';
import { useTelemetry } from '@/hooks/useTelemetry';
import { cn } from '@/lib/utils';

interface SensorDataFeederProps {
  compact?: boolean;
}

export const SensorDataFeeder: React.FC<SensorDataFeederProps> = ({ compact = false }) => {
  const { summary, farmProfile, updateFarmProfile, feedData, setScenario } = useTelemetry();

  const [moisture, setMoisture] = useState(String(summary.soil_moisture.current));
  const [temperature, setTemperature] = useState(String(summary.temperature.current));
  const [humidity, setHumidity] = useState(String(summary.humidity.current));
  const [pump, setPump] = useState<boolean>(summary.pump.state);
  const [mode, setMode] = useState<'auto' | 'manual'>(summary.pump.mode);
  const [justApplied, setJustApplied] = useState(false);

  useEffect(() => {
    setMoisture(String(summary.soil_moisture.current));
    setTemperature(String(summary.temperature.current));
    setHumidity(String(summary.humidity.current));
    setPump(summary.pump.state);
    setMode(summary.pump.mode);
  }, [
    summary.soil_moisture.current,
    summary.temperature.current,
    summary.humidity.current,
    summary.pump.state,
    summary.pump.mode,
  ]);

  const handleApply = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    feedData({
      soil_moisture: Number(moisture),
      temperature: Number(temperature),
      humidity: Number(humidity),
      pump,
      mode,
    });
    setJustApplied(true);
    setTimeout(() => setJustApplied(false), 2000);
  };

  const handleSelectScenario = (key: string) => {
    setScenario(key);
    // sync local slider states with the scenario
    setTimeout(() => {
      if (key === 'drought') {
        setMoisture('18.4');
        setTemperature('35.8');
        setHumidity('24.0');
      } else if (key === 'optimal') {
        setMoisture('48.0');
        setTemperature('24.5');
        setHumidity('62.0');
      } else if (key === 'saturated') {
        setMoisture('82.5');
        setTemperature('21.0');
        setHumidity('85.0');
      } else if (key === 'heatwave') {
        setMoisture('27.2');
        setTemperature('39.5');
        setHumidity('19.0');
      } else if (key === 'irrigating') {
        setMoisture('25.0');
        setTemperature('29.0');
        setHumidity('45.0');
        setPump(true);
      }
      setJustApplied(true);
      setTimeout(() => setJustApplied(false), 2000);
    }, 50);
  };

  return (
    <div className={cn(
      'rounded-2xl border border-white/[0.08] backdrop-blur-md relative overflow-hidden',
      compact ? 'p-4 bg-[#0d1510]/80' : 'p-6 bg-gradient-to-br from-[#0c140f] to-[#070b08]'
    )}>
      {/* Background radial accent */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shadow-glow">
            <Sliders className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Manual Sensor Readings &amp; Simulator
              </h3>
              <span className="px-2 py-0.5 text-[9px] font-mono uppercase bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">
                Interactive Input
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Inject custom sensor readings directly into the webapp. All dashboard widgets, 3D farm &amp; Agro AI react immediately.
            </p>
          </div>
        </div>

        {justApplied && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-mono animate-bounce">
            <Check className="w-3.5 h-3.5" />
            <span>Readings Ingested!</span>
          </div>
        )}
      </div>

      {/* 1-Click Rapid Agricultural Presets */}
      <div className="mb-6">
        <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-2 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-emerald-400" />
          <span>Quick Scenario Presets</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          <button
            type="button"
            onClick={() => handleSelectScenario('drought')}
            className="p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-left transition-all group"
          >
            <div className="flex items-center gap-1.5 text-amber-400 font-medium text-xs mb-0.5">
              <span>🌵 Drought Stress</span>
            </div>
            <div className="text-[10px] font-mono text-zinc-400">18.4% · 36°C</div>
          </button>

          <button
            type="button"
            onClick={() => handleSelectScenario('optimal')}
            className="p-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-left transition-all group"
          >
            <div className="flex items-center gap-1.5 text-emerald-400 font-medium text-xs mb-0.5">
              <span>🌾 Optimal Farm</span>
            </div>
            <div className="text-[10px] font-mono text-zinc-400">48.0% · 24°C</div>
          </button>

          <button
            type="button"
            onClick={() => handleSelectScenario('saturated')}
            className="p-2.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 text-left transition-all group"
          >
            <div className="flex items-center gap-1.5 text-sky-400 font-medium text-xs mb-0.5">
              <span>🌊 Saturated Soil</span>
            </div>
            <div className="text-[10px] font-mono text-zinc-400">82.5% · 21°C</div>
          </button>

          <button
            type="button"
            onClick={() => handleSelectScenario('heatwave')}
            className="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-left transition-all group"
          >
            <div className="flex items-center gap-1.5 text-red-400 font-medium text-xs mb-0.5">
              <span>🔥 Heatwave</span>
            </div>
            <div className="text-[10px] font-mono text-zinc-400">27.2% · 39.5°C</div>
          </button>

          <button
            type="button"
            onClick={() => handleSelectScenario('irrigating')}
            className="p-2.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/20 text-left transition-all group col-span-2 sm:col-span-1"
          >
            <div className="flex items-center gap-1.5 text-teal-300 font-medium text-xs mb-0.5">
              <span>💧 Active Pump</span>
            </div>
            <div className="text-[10px] font-mono text-zinc-400">Pump: ON</div>
          </button>
        </div>
      </div>

      <div className="mb-5 rounded-xl border border-emerald-500/15 bg-emerald-500/[0.04] p-4">
        <div className="mb-3 flex items-center gap-2">
          <Sprout className="h-4 w-4 text-emerald-400" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-200">Crop &amp; Cultivation Profile</h4>
          <span className="text-[10px] text-zinc-500">Saved on this device for Agro AI</span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {([
            ['crop', 'Crop', 'e.g. tomato, rice, maize'],
            ['growth_stage', 'Growth stage', 'e.g. seedling, flowering'],
            ['cultivation_method', 'Cultivation method', 'e.g. open field, greenhouse, hydroponic'],
            ['soil_type', 'Soil type (optional)', 'e.g. sandy loam, clay'],
          ] as const).map(([field, label, placeholder]) => (
            <label key={field} className="text-[10px] font-mono uppercase tracking-wide text-zinc-400">
              {label}
              <input
                type="text"
                value={farmProfile[field]}
                onChange={(e) => updateFarmProfile({ ...farmProfile, [field]: e.target.value })}
                placeholder={placeholder}
                className="mt-1.5 w-full rounded-lg border border-white/[0.08] bg-[#080d0a] px-3 py-2 text-xs normal-case tracking-normal text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-emerald-500/50"
              />
            </label>
          ))}
        </div>
      </div>

      <form onSubmit={handleApply} className="space-y-4">
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] p-4">
          <div className="mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-200">Enter sensor readings manually</h4>
            <p className="mt-1 text-[11px] text-zinc-400">Type your measurements here, or fine-tune them with the sliders below. Apply to update the dashboard and Agro AI.</p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label htmlFor="manual-soil-moisture" className="text-[10px] font-mono uppercase tracking-wide text-zinc-300">
              Soil moisture (%)
              <input
                id="manual-soil-moisture"
                type="number"
                min="0"
                max="100"
                step="any"
                required
                value={moisture}
                onChange={(e) => setMoisture(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-white/[0.1] bg-[#080d0a] px-3 py-2 text-sm font-mono text-emerald-300 outline-none focus:border-emerald-500/60"
              />
            </label>
            <label htmlFor="manual-temperature" className="text-[10px] font-mono uppercase tracking-wide text-zinc-300">
              Temperature (°C)
              <input
                id="manual-temperature"
                type="number"
                min="-40"
                max="80"
                step="any"
                required
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-white/[0.1] bg-[#080d0a] px-3 py-2 text-sm font-mono text-amber-300 outline-none focus:border-amber-500/60"
              />
            </label>
            <label htmlFor="manual-humidity" className="text-[10px] font-mono uppercase tracking-wide text-zinc-300">
              Humidity (%)
              <input
                id="manual-humidity"
                type="number"
                min="0"
                max="100"
                step="any"
                required
                value={humidity}
                onChange={(e) => setHumidity(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-white/[0.1] bg-[#080d0a] px-3 py-2 text-sm font-mono text-teal-300 outline-none focus:border-teal-500/60"
              />
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Soil Moisture Slider */}
          <div className="p-3.5 rounded-xl bg-black/30 border border-white/[0.05]">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5 font-mono">
                <Droplets className="w-3.5 h-3.5 text-emerald-400" />
                <span>Soil Moisture</span>
              </label>
              <span className={cn(
                'text-sm font-mono font-bold',
                Number(moisture) < 30 ? 'text-amber-400' : Number(moisture) > 75 ? 'text-sky-400' : 'text-emerald-400'
              )}>{moisture}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="any"
              value={Number(moisture) || 0}
              onChange={(e) => setMoisture(e.target.value)}
              className="w-full accent-emerald-500 h-2 bg-zinc-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-zinc-500 font-mono mt-1">
              <span>0% Arid</span>
              <span>30% Threshold</span>
              <span>100% Sat</span>
            </div>
          </div>

          {/* Temperature Slider */}
          <div className="p-3.5 rounded-xl bg-black/30 border border-white/[0.05]">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5 font-mono">
                <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                <span>Ambient Temperature</span>
              </label>
              <span className="text-sm font-mono font-bold text-amber-400">{temperature}°C</span>
            </div>
            <input
              type="range"
              min="-40"
              max="80"
              step="any"
              value={Number(temperature) || 0}
              onChange={(e) => setTemperature(e.target.value)}
              className="w-full accent-amber-500 h-2 bg-zinc-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-zinc-500 font-mono mt-1">
              <span>-40°C</span>
              <span>25°C Optimal</span>
              <span>80°C</span>
            </div>
          </div>

          {/* Humidity Slider */}
          <div className="p-3.5 rounded-xl bg-black/30 border border-white/[0.05]">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5 font-mono">
                <Wind className="w-3.5 h-3.5 text-teal-400" />
                <span>Relative Humidity</span>
              </label>
              <span className="text-sm font-mono font-bold text-teal-400">{humidity}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="any"
              value={Number(humidity) || 0}
              onChange={(e) => setHumidity(e.target.value)}
              className="w-full accent-teal-500 h-2 bg-zinc-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-zinc-500 font-mono mt-1">
              <span>0% Dry</span>
              <span>65% Optimal</span>
              <span>100% Saturated</span>
            </div>
          </div>
        </div>

        {/* Pump & Mode Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            {/* Pump Toggle */}
            <button
              type="button"
              onClick={() => setPump(!pump)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-medium border transition-all',
                pump
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-glow'
                  : 'bg-white/[0.03] text-zinc-400 border-white/[0.08] hover:text-white'
              )}
            >
              <Power className={cn('w-3.5 h-3.5', pump ? 'text-emerald-400 animate-pulse' : 'text-zinc-500')} />
              <span>Pump State: <strong>{pump ? 'ON (Spraying)' : 'OFF (Idle)'}</strong></span>
            </button>

            {/* Mode Toggle */}
            <div className="flex items-center p-1 rounded-xl bg-black/40 border border-white/[0.06] text-xs font-mono">
              <button
                type="button"
                onClick={() => setMode('auto')}
                className={cn(
                  'px-3 py-1 rounded-lg transition-all',
                  mode === 'auto' ? 'bg-emerald-500/20 text-emerald-300' : 'text-zinc-500 hover:text-zinc-300'
                )}
              >
                Auto Mode
              </button>
              <button
                type="button"
                onClick={() => setMode('manual')}
                className={cn(
                  'px-3 py-1 rounded-lg transition-all',
                  mode === 'manual' ? 'bg-emerald-500/20 text-emerald-300' : 'text-zinc-500 hover:text-zinc-300'
                )}
              >
                Manual
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-medium text-xs shadow-glow transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Apply &amp; Feed to Farm Dashboard</span>
          </button>
        </div>
      </form>
    </div>
  );
};
