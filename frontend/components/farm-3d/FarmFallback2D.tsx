'use client';

import React from 'react';
import { FarmPlot } from '@/lib/types';
import { Droplet, Radio, Cpu, Power, Sprout } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FarmFallback2DProps {
  plots: FarmPlot[];
  selectedPlotId: string | null;
  onSelectPlot: (plot: FarmPlot) => void;
  pumpActive: boolean;
  liveMoisture: number;
}

export const FarmFallback2D: React.FC<FarmFallback2DProps> = ({
  plots,
  selectedPlotId,
  onSelectPlot,
  pumpActive,
  liveMoisture,
}) => {
  return (
    <div className="w-full h-full bg-[#090e0b] rounded-2xl border border-white/[0.08] p-6 flex flex-col justify-between relative overflow-hidden select-none">
      {/* Background blueprint grid */}
      <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between pb-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Sprout className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
            2D Agricultural Schematic · Fallback Digital Twin
          </h3>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-zinc-500">Actuator:</span>
          <span className={cn('px-2 py-0.5 rounded font-bold uppercase', pumpActive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-zinc-800 text-zinc-400')}>
            {pumpActive ? 'Pump Spraying' : 'Pump Standby'}
          </span>
        </div>
      </div>

      {/* Main Schematic Layout */}
      <div className="relative z-10 my-auto py-6 grid grid-cols-1 md:grid-cols-5 gap-6 items-center">
        {/* Left Column: Water Reservoir & Pump System */}
        <div className="p-4 rounded-xl bg-black/40 border border-white/[0.08] text-center space-y-3">
          <div className="w-12 h-16 mx-auto rounded-lg bg-sky-950 border border-sky-500/40 flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute bottom-0 left-0 right-0 h-3/4 bg-sky-500/30" />
            <Droplet className="w-5 h-5 text-sky-400 relative z-10" />
            <span className="text-[9px] font-mono text-sky-200 mt-1 relative z-10">TANK</span>
          </div>

          <div className="pt-2 border-t border-white/[0.06]">
            <div className="flex items-center justify-center gap-1.5 text-xs font-mono text-zinc-300">
              <Power className={cn('w-3.5 h-3.5', pumpActive ? 'text-emerald-400 animate-pulse' : 'text-zinc-500')} />
              <span>Pump M-1</span>
            </div>
            <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
              {pumpActive ? '12V DC Relay ON' : 'Relay Idle'}
            </div>
          </div>
        </div>

        {/* Center/Right: 4 Farm Plots Grid */}
        <div className="md:col-span-4 grid grid-cols-2 gap-4">
          {plots.map((plot) => {
            const moisture = plot.id === 'plot_1' ? liveMoisture : plot.moisture;
            const isSelected = selectedPlotId === plot.id;
            const isDry = moisture < 30;

            return (
              <div
                key={plot.id}
                onClick={() => onSelectPlot(plot)}
                className={cn(
                  'p-4 rounded-xl border transition-all cursor-pointer relative',
                  isSelected
                    ? 'border-emerald-500 bg-emerald-950/20 shadow-glow'
                    : 'border-white/[0.08] bg-black/30 hover:border-white/[0.15] hover:bg-white/[0.02]'
                )}
              >
                {/* Plot Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                      <Sprout className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-100">{plot.name}</h4>
                      <p className="text-[10px] text-zinc-400 font-mono">{plot.crop}</p>
                    </div>
                  </div>

                  {plot.sensorInstalled && (
                    <span className="flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      <Radio className="w-3 h-3" /> ESP8266
                    </span>
                  )}
                </div>

                {/* Moisture Metric */}
                <div className="my-3 flex items-baseline justify-between">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase">Soil Moisture:</span>
                  <span className={cn(
                    'text-lg font-mono font-extrabold',
                    isDry ? 'text-amber-400' : 'text-emerald-400'
                  )}>
                    {moisture.toFixed(1)}%
                  </span>
                </div>

                {/* Moisture Bar */}
                <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-300',
                      isDry ? 'bg-amber-500' : 'bg-emerald-500'
                    )}
                    style={{ width: `${Math.min(100, moisture)}%` }}
                  />
                </div>

                {/* Irrigation Piping Status */}
                {pumpActive && (
                  <div className="mt-3 pt-2 border-t border-white/[0.06] flex items-center gap-1 text-[10px] text-sky-400 font-mono animate-pulse">
                    <Droplet className="w-3 h-3" /> Water Sprinklers Emitting
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="relative z-10 pt-3 border-t border-white/[0.06] text-xs text-zinc-500 font-mono flex items-center justify-between">
        <span>Click any plot or node to inspect calibration parameters</span>
        <span>Low-Power 2D Digital Twin Engine</span>
      </div>
    </div>
  );
};
