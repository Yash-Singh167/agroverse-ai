'use client';

import React from 'react';
import { 
  Droplets, 
  Thermometer, 
  Wind, 
  Power, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Clock,
  Gauge
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface SensorCardProps {
  type: 'moisture' | 'temperature' | 'humidity' | 'pump';
  value: number | boolean | string;
  unit?: string;
  statusText: string;
  statusColor: 'emerald' | 'amber' | 'blue' | 'red' | 'zinc';
  trendDirection?: 'up' | 'down' | 'stable';
  trendValue?: string;
  subtext?: string;
  meta?: {
    lastTime?: string | null;
    duration?: string;
    mode?: string;
    threshold?: string;
  };
}

export const SensorCard: React.FC<SensorCardProps> = ({
  type,
  value,
  unit = '',
  statusText,
  statusColor,
  trendDirection,
  trendValue,
  subtext,
  meta,
}) => {
  const getIcon = () => {
    switch (type) {
      case 'moisture':
        return <Droplets className="w-4 h-4 text-emerald-400" />;
      case 'temperature':
        return <Thermometer className="w-4 h-4 text-amber-400" />;
      case 'humidity':
        return <Wind className="w-4 h-4 text-teal-400" />;
      case 'pump':
        return <Power className="w-4 h-4 text-emerald-400" />;
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'moisture':
        return 'Soil Moisture';
      case 'temperature':
        return 'Ambient Temp';
      case 'humidity':
        return 'Relative Humidity';
      case 'pump':
        return 'Irrigation Pump';
    }
  };

  const colorClasses = {
    emerald: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    amber: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    blue: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    red: 'bg-red-500/15 text-red-300 border-red-500/30',
    zinc: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
  }[statusColor];

  // Percentage for progress indicator if numeric
  const numericVal = typeof value === 'number' ? Math.min(100, Math.max(0, value)) : 0;

  return (
    <div className="p-5 rounded-2xl bg-[#0f1712]/70 border border-white/[0.08] backdrop-blur-md relative overflow-hidden transition-all duration-200 hover:border-emerald-500/30 hover:shadow-glow">
      {/* Background radial accent glow */}
      <div className={cn(
        'absolute -right-8 -top-8 w-32 h-32 rounded-full blur-3xl pointer-events-none opacity-20',
        type === 'pump' && value === true ? 'bg-emerald-400 opacity-40' : 'bg-emerald-500'
      )} />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center">
            {getIcon()}
          </div>
          <div>
            <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider font-mono">
              {getTitle()}
            </h3>
            {subtext && <p className="text-[10px] text-zinc-500 font-mono">{subtext}</p>}
          </div>
        </div>

        {/* Status Badge */}
        <span className={cn('text-[11px] font-mono px-2 py-0.5 rounded-full border uppercase tracking-wider', colorClasses)}>
          {statusText}
        </span>
      </div>

      {/* Main Metric Value */}
      <div className="my-3 flex items-baseline justify-between">
        <div className="flex items-baseline gap-1">
          {type === 'pump' ? (
            <div className="flex items-center gap-3">
              <span className={cn(
                'text-3xl font-extrabold tracking-tight font-mono',
                value ? 'text-emerald-400' : 'text-zinc-400'
              )}>
                {value ? 'ACTIVE' : 'IDLE'}
              </span>
              {value === true && (
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
              )}
            </div>
          ) : (
            <>
              <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-mono">
                {value}
              </span>
              <span className="text-lg font-medium text-zinc-400 font-mono">{unit}</span>
            </>
          )}
        </div>

        {/* Trend Indicator */}
        {trendValue && (
          <div className="flex items-center gap-1 text-xs font-mono">
            {trendDirection === 'up' && <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />}
            {trendDirection === 'down' && <TrendingDown className="w-3.5 h-3.5 text-amber-400" />}
            {trendDirection === 'stable' && <Minus className="w-3.5 h-3.5 text-zinc-500" />}
            <span className={trendDirection === 'down' ? 'text-amber-400' : 'text-emerald-400'}>
              {trendValue}
            </span>
          </div>
        )}
      </div>

      {/* Custom Graphic Gauge for Soil Moisture */}
      {type === 'moisture' && (
        <div className="mt-4 pt-3 border-t border-white/[0.04]">
          <div className="flex justify-between text-[10px] font-mono text-zinc-500 mb-1.5">
            <span>Critical (&lt;30%)</span>
            <span>Target (30-75%)</span>
            <span>Saturated</span>
          </div>
          <div className="w-full h-2 rounded-full bg-zinc-800/80 overflow-hidden relative">
            <motion.div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                numericVal < 30 ? 'bg-amber-500' : numericVal > 75 ? 'bg-sky-500' : 'bg-emerald-500'
              )}
              initial={{ width: 0 }}
              animate={{ width: `${numericVal}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>
      )}

      {/* Temperature / Humidity Range Bar */}
      {(type === 'temperature' || type === 'humidity') && (
        <div className="mt-4 pt-3 border-t border-white/[0.04] flex items-center justify-between text-xs font-mono text-zinc-400">
          <div className="flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-zinc-500" />
            <span>Optimal Range:</span>
          </div>
          <span className="text-zinc-200">
            {type === 'temperature' ? '20°C - 32°C' : '50% - 75%'}
          </span>
        </div>
      )}

      {/* Pump Meta Information */}
      {type === 'pump' && meta && (
        <div className="mt-4 pt-3 border-t border-white/[0.04] space-y-1.5 text-xs font-mono">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-zinc-500">Mode:</span>
            <span className="text-emerald-400 uppercase font-semibold">
              {meta.mode || 'AUTOMATIC'}
            </span>
          </div>
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-zinc-500">Runtime Today:</span>
            <span className="text-zinc-200">{meta.duration || '0m'}</span>
          </div>
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-zinc-500">Last Irrigated:</span>
            <span className="text-zinc-300 text-[11px] truncate max-w-[150px]">
              {meta.lastTime || 'No recent cycle'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
