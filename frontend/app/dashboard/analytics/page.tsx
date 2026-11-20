'use client';

import React, { useState } from 'react';
import { 
  LineChart as LineChartIcon, 
  Activity, 
  Droplets, 
  Thermometer, 
  Wind, 
  Clock, 
  Calendar,
  Filter
} from 'lucide-react';
import { useTelemetry } from '@/hooks/useTelemetry';
import { 
  AreaChart, 
  Area, 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine 
} from 'recharts';
import { SensorDataFeeder } from '@/components/dashboard/SensorDataFeeder';
import { cn } from '@/lib/utils';

export default function AnalyticsPage() {
  const { history, summary } = useTelemetry();
  const [timeRange, setTimeRange] = useState<'6h' | '12h' | '24h' | 'all'>('24h');

  // Filter history based on selected time range
  const filteredData = React.useMemo(() => {
    const total = history.length;
    let count = total;
    if (timeRange === '6h') count = Math.min(6, total);
    else if (timeRange === '12h') count = Math.min(12, total);
    else if (timeRange === '24h') count = Math.min(24, total);

    return history.slice(-count).map((item) => ({
      time: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      moisture: item.soil_moisture,
      temperature: item.temperature,
      humidity: item.humidity,
      pump: item.pump ? 100 : 0,
      waterVolume: item.pump ? 2.5 : 0,
    }));
  }, [history, timeRange]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Hydrological Analytics &amp; Sensor Trends
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Time Series
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Historical environmental dynamics, transpiration rates, and irrigation correlations.
          </p>
        </div>

        {/* Time Range Filters */}
        <div className="flex items-center p-1 rounded-xl bg-black/40 border border-white/[0.08] text-xs font-mono">
          {(['6h', '12h', '24h', 'all'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={cn(
                'px-3 py-1.5 rounded-lg uppercase transition-all',
                timeRange === range
                  ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30'
                  : 'text-zinc-400 hover:text-white'
              )}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Sensor Data Feeder Drawer / Quick Input */}
      <SensorDataFeeder compact />

      {/* Primary Chart: Soil Moisture vs Trigger Threshold */}
      <div className="p-6 rounded-2xl bg-[#0f1712]/70 border border-white/[0.08] backdrop-blur-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Droplets className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
              Soil Moisture Infiltration &amp; Depletion Curve
            </h3>
          </div>
          <div className="text-xs font-mono text-zinc-400 flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Moisture %
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> 30% Threshold
            </span>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={filteredData}>
              <defs>
                <linearGradient id="moistFullGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
              <XAxis dataKey="time" stroke="#52525b" fontSize={11} tickLine={false} />
              <YAxis stroke="#52525b" fontSize={11} unit="%" domain={[0, 100]} tickLine={false} />
              <ReferenceLine y={summary.soil_moisture.threshold_low} stroke="#f59e0b" strokeDasharray="4 4" />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const p = payload[0].payload;
                    return (
                      <div className="p-3 rounded-xl bg-[#0c140f] border border-white/[0.1] text-xs font-mono shadow-xl space-y-1">
                        <div className="text-zinc-400">{p.time}</div>
                        <div className="text-emerald-400 font-bold">Soil Moisture: {p.moisture}%</div>
                        <div className="text-amber-400 text-[10px]">Threshold: {summary.soil_moisture.threshold_low}%</div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area type="monotone" dataKey="moisture" stroke="#34d399" strokeWidth={2} fill="url(#moistFullGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Dual Charts Grid: Ambient Climate & Irrigation Volumes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ambient Temperature & Relative Humidity */}
        <div className="p-6 rounded-2xl bg-[#0f1712]/70 border border-white/[0.08] backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
                Atmospheric Dynamics (Temp &amp; RH)
              </h3>
            </div>
            <span className="text-[10px] font-mono text-zinc-400">Microclimate</span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filteredData}>
                <defs>
                  <linearGradient id="tempAnalyticGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="humAnalyticGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
                <XAxis dataKey="time" stroke="#52525b" fontSize={11} tickLine={false} />
                <YAxis stroke="#52525b" fontSize={11} tickLine={false} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const p = payload[0].payload;
                      return (
                        <div className="p-3 rounded-xl bg-[#0c140f] border border-white/[0.1] text-xs font-mono shadow-xl space-y-1">
                          <div className="text-zinc-400">{p.time}</div>
                          <div className="text-amber-400 font-bold">Temperature: {p.temperature}°C</div>
                          <div className="text-cyan-400 font-bold">Humidity: {p.humidity}%</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area type="monotone" dataKey="temperature" stroke="#fbbf24" strokeWidth={2} fill="url(#tempAnalyticGrad)" />
                <Area type="monotone" dataKey="humidity" stroke="#22d3ee" strokeWidth={2} fill="url(#humAnalyticGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Irrigation Volumes Dispensed Histogram */}
        <div className="p-6 rounded-2xl bg-[#0f1712]/70 border border-white/[0.08] backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Droplets className="w-4 h-4 text-teal-400" />
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
                Dispensed Irrigation Volume (Liters)
              </h3>
            </div>
            <span className="text-[10px] font-mono text-zinc-400">Pump Actuation</span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
                <XAxis dataKey="time" stroke="#52525b" fontSize={11} tickLine={false} />
                <YAxis stroke="#52525b" fontSize={11} unit=" L" tickLine={false} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const p = payload[0].payload;
                      return (
                        <div className="p-3 rounded-xl bg-[#0c140f] border border-white/[0.1] text-xs font-mono shadow-xl space-y-1">
                          <div className="text-zinc-400">{p.time}</div>
                          <div className="text-teal-400 font-bold">Volume: {p.waterVolume} Liters</div>
                          <div className="text-zinc-500 text-[10px]">Pump: {p.pump > 0 ? 'ACTIVE' : 'IDLE'}</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="waterVolume" fill="#14b8a6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
