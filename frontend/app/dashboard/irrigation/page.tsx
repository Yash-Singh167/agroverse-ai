'use client';

import React, { useState } from 'react';
import { 
  Droplet, 
  Power, 
  Sliders, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Gauge, 
  Activity,
  Layers,
  Check
} from 'lucide-react';
import { useTelemetry } from '@/hooks/useTelemetry';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function IrrigationControlPage() {
  const { summary, events, togglePump, updateThresholds, setOperatingMode } = useTelemetry();

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [pendingState, setPendingState] = useState(false);
  const [lowThresh, setLowThresh] = useState<number>(summary.soil_moisture.threshold_low);
  const [highThresh, setHighThresh] = useState<number>(summary.soil_moisture.threshold_high);
  const [isApplying, setIsApplying] = useState(false);
  const [thresholdSaved, setThresholdSaved] = useState(false);

  const pumpActive = summary.pump.state;
  const currentMode = summary.pump.mode;
  const currentMoisture = summary.soil_moisture.current;

  const handleRequestPumpToggle = (targetState: boolean) => {
    setPendingState(targetState);
    setConfirmModalOpen(true);
  };

  const handleConfirmToggle = async () => {
    setConfirmModalOpen(false);
    setIsApplying(true);
    try {
      await togglePump(pendingState);
    } finally {
      setIsApplying(false);
    }
  };

  const handleSaveThresholds = (e: React.FormEvent) => {
    e.preventDefault();
    updateThresholds(Number(lowThresh), Number(highThresh));
    setThresholdSaved(true);
    setTimeout(() => setThresholdSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Irrigation Actuator Command Center
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Relay Protection
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Manual override, automatic threshold calibration, and continuous runtime fail-safe timers.
          </p>
        </div>

        {/* Live Status Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs font-mono">
          <span className={cn('w-2 h-2 rounded-full', pumpActive ? 'bg-emerald-400 animate-ping' : 'bg-zinc-500')} />
          <span className="text-zinc-400">Pump:</span>
          <span className={cn('font-bold', pumpActive ? 'text-emerald-400' : 'text-zinc-300')}>
            {pumpActive ? 'ACTUATED (ON)' : 'STANDBY (OFF)'}
          </span>
        </div>
      </div>

      {/* Main Grid: Actuator Control + Safety Specs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Primary Actuation Deck */}
        <div className="lg:col-span-2 space-y-6">
          {/* Actuator State Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-[#101b14] to-[#0a110e] border border-white/[0.08] relative overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-xs font-mono uppercase text-zinc-400">Actuator Circuit</span>
                <h3 className="text-lg font-bold text-white mt-0.5">Submersible Water Pump M-1</h3>
              </div>

              {/* Mode Toggle Pills */}
              <div className="flex items-center p-1 rounded-xl bg-black/50 border border-white/[0.08] text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setOperatingMode('auto')}
                  className={cn(
                    'px-3 py-1.5 rounded-lg transition-all',
                    currentMode === 'auto'
                      ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30'
                      : 'text-zinc-400 hover:text-white'
                  )}
                >
                  Automatic Mode
                </button>
                <button
                  type="button"
                  onClick={() => setOperatingMode('manual')}
                  className={cn(
                    'px-3 py-1.5 rounded-lg transition-all',
                    currentMode === 'manual'
                      ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30'
                      : 'text-zinc-400 hover:text-white'
                  )}
                >
                  Manual Override
                </button>
              </div>
            </div>

            {/* Big Interactive Power Switch */}
            <div className="p-6 rounded-2xl bg-black/40 border border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-1 text-center sm:text-left">
                <div className="text-xs font-mono text-zinc-400 uppercase">Confirmed Hardware Relay State</div>
                <div className="flex items-center gap-3 justify-center sm:justify-start">
                  <span className={cn(
                    'text-3xl font-extrabold font-mono',
                    pumpActive ? 'text-emerald-400' : 'text-zinc-400'
                  )}>
                    {pumpActive ? 'PUMP ENERGIZED' : 'PUMP DE-ENERGIZED'}
                  </span>
                  {pumpActive && (
                    <span className="flex h-3 w-3 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400">
                  {pumpActive
                    ? 'Water is currently flowing through distribution emitters into crop beds.'
                    : 'Relay contacts are open. Zero hydraulic discharge.'}
                </p>
              </div>

              {/* Main Actuation Trigger Button */}
              <button
                type="button"
                onClick={() => handleRequestPumpToggle(!pumpActive)}
                disabled={isApplying}
                className={cn(
                  'px-6 py-3.5 rounded-xl text-xs font-mono uppercase tracking-wider font-bold transition-all shadow-xl cursor-pointer flex items-center gap-2 shrink-0',
                  pumpActive
                    ? 'bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 shadow-glow'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-glow'
                )}
              >
                <Power className="w-4 h-4" />
                <span>{pumpActive ? 'Halt Pump Circuit' : 'Energize Pump Now'}</span>
              </button>
            </div>

            {/* Safety Notice */}
            <div className="mt-4 flex items-center gap-2 text-xs text-zinc-400 font-mono">
              <ShieldAlert className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Built-in fail-safe timer will automatically shut off the pump after 10 continuous minutes.</span>
            </div>
          </div>

          {/* Threshold Configuration Card */}
          <div className="p-6 rounded-2xl bg-[#0f1712]/70 border border-white/[0.08] backdrop-blur-md">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
                  Autonomous Hydrology Threshold Setpoints
                </h3>
              </div>
              {thresholdSaved && (
                <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-500/20 px-2.5 py-0.5 rounded border border-emerald-500/30">
                  <Check className="w-3 h-3" /> Saved!
                </span>
              )}
            </div>

            <form onSubmit={handleSaveThresholds} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Low Threshold */}
                <div className="p-3.5 rounded-xl bg-black/30 border border-white/[0.05]">
                  <div className="flex justify-between items-baseline mb-2">
                    <label className="text-xs font-mono text-zinc-300">Minimum Moisture Trigger</label>
                    <span className="text-sm font-mono font-bold text-amber-400">{lowThresh}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="60"
                    step="1"
                    value={lowThresh}
                    onChange={(e) => setLowThresh(parseInt(e.target.value))}
                    className="w-full accent-amber-500 h-2 bg-zinc-800 rounded-lg cursor-pointer"
                  />
                  <p className="text-[10px] text-zinc-500 font-mono mt-1">
                    When soil moisture drops below this, automatic irrigation engages.
                  </p>
                </div>

                {/* High Saturation Threshold */}
                <div className="p-3.5 rounded-xl bg-black/30 border border-white/[0.05]">
                  <div className="flex justify-between items-baseline mb-2">
                    <label className="text-xs font-mono text-zinc-300">Saturation Cutoff Target</label>
                    <span className="text-sm font-mono font-bold text-sky-400">{highThresh}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="95"
                    step="1"
                    value={highThresh}
                    onChange={(e) => setHighThresh(parseInt(e.target.value))}
                    className="w-full accent-sky-500 h-2 bg-zinc-800 rounded-lg cursor-pointer"
                  />
                  <p className="text-[10px] text-zinc-500 font-mono mt-1">
                    Pump shuts off once moisture climbs to this upper bound.
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white font-medium text-xs font-mono shadow-glow transition-all cursor-pointer"
                >
                  Save Threshold Setpoints
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Diagnostic & Consumption Specs */}
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="p-5 rounded-2xl bg-[#0f1712]/70 border border-white/[0.08] backdrop-blur-md space-y-4">
            <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono">
              Hydraulic Performance
            </h4>

            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <span className="text-zinc-400">Current Soil Moisture:</span>
                <span className={cn('font-bold', currentMoisture < 30 ? 'text-amber-400' : 'text-emerald-400')}>
                  {currentMoisture}%
                </span>
              </div>

              <div className="flex justify-between items-center p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <span className="text-zinc-400">Total Run Duration:</span>
                <span className="text-zinc-200">
                  {Math.round(summary.pump.total_duration_today_sec / 60)} mins
                </span>
              </div>

              <div className="flex justify-between items-center p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <span className="text-zinc-400">Volume Dispensed:</span>
                <span className="text-teal-400 font-bold">
                  {summary.pump.estimated_water_liters_today} Liters
                </span>
              </div>

              <div className="flex justify-between items-center p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <span className="text-zinc-400">Water Conservation:</span>
                <span className="text-emerald-400 font-bold">+36.2% Saved</span>
              </div>
            </div>
          </div>

          {/* Quick link to 3D Digital Twin */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-[#0c1611] to-[#070c09] border border-white/[0.08] space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-bold uppercase">
              <Layers className="w-4 h-4" />
              <span>Visual Verification</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Observe water droplets spray onto crop beds and soil color shift in the 3D twin in real-time.
            </p>
            <Link
              href="/dashboard/farm"
              className="inline-flex items-center gap-2 text-xs font-mono font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Open 3D Farm Digital Twin &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Safety Confirmation Modal */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#0d1611] border border-white/[0.1] shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center border',
                pendingState ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-red-500/20 border-red-500/40 text-red-400'
              )}>
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase font-mono">
                  Confirm Pump {pendingState ? 'Activation' : 'Deactivation'}
                </h3>
                <p className="text-xs text-zinc-400">Hardware safety verification required</p>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Are you sure you want to {pendingState ? 'energize the 12V submersible irrigation pump' : 'halt water distribution'}? The command will be queued and confirmed immediately.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.06]">
              <button
                type="button"
                onClick={() => setConfirmModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-mono text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmToggle}
                className={cn(
                  'px-4 py-2 rounded-xl text-xs font-mono font-bold text-white transition-all shadow-glow',
                  pendingState ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-600 hover:bg-red-500'
                )}
              >
                Confirm Command
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
