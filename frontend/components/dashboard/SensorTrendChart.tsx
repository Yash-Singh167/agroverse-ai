'use client';

import React, { useState } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine 
} from 'recharts';
import { SensorHistoryRecord } from '@/lib/types';
import { Droplets, Thermometer, Wind, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SensorTrendChartProps {
  data: SensorHistoryRecord[];
}

export const SensorTrendChart: React.FC<SensorTrendChartProps> = ({ data }) => {
  const [selectedMetric, setSelectedMetric] = useState<'moisture' | 'temperature' | 'humidity'>('moisture');

  // Format data for Recharts
  const chartData = data.map((item) => {
    const time = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return {
      time,
      moisture: item.soil_moisture,
      temperature: item.temperature,
      humidity: item.humidity,
      pump: item.pump ? 100 : 0,
    };
  });

  const getMetricConfig = () => {
    switch (selectedMetric) {
      case 'moisture':
        return {
          key: 'moisture',
          label: 'Soil Moisture',
          unit: '%',
          color: '#10b981',
          strokeColor: '#34d399',
          gradientId: 'moistureGrad',
          threshold: 30,
        };
      case 'temperature':
        return {
          key: 'temperature',
          label: 'Temperature',
          unit: '°C',
          color: '#f59e0b',
          strokeColor: '#fbbf24',
          gradientId: 'tempGrad',
          threshold: 35,
        };
      case 'humidity':
        return {
          key: 'humidity',
          label: 'Relative Humidity',
          unit: '%',
          color: '#06b6d4',
          strokeColor: '#22d3ee',
          gradientId: 'humidityGrad',
          threshold: 40,
        };
    }
  };

  const config = getMetricConfig();

  return (
    <div className="p-6 rounded-2xl bg-[#0f1712]/70 border border-white/[0.08] backdrop-blur-md">
      {/* Header with Title and Metric Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider font-mono">
              Hydrological Dynamics · Telemetry History
            </h3>
          </div>
          <p className="text-xs text-zinc-400">
            Real-time IoT environmental fluctuations sampled across 24h cycle
          </p>
        </div>

        {/* Metric Selector Buttons */}
        <div className="flex items-center p-1 rounded-xl bg-black/40 border border-white/[0.06] self-start sm:self-auto">
          <button
            onClick={() => setSelectedMetric('moisture')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all',
              selectedMetric === 'moisture'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-zinc-400 hover:text-zinc-200'
            )}
          >
            <Droplets className="w-3.5 h-3.5" />
            <span>Moisture</span>
          </button>

          <button
            onClick={() => setSelectedMetric('temperature')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all',
              selectedMetric === 'temperature'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-zinc-400 hover:text-zinc-200'
            )}
          >
            <Thermometer className="w-3.5 h-3.5" />
            <span>Temp</span>
          </button>

          <button
            onClick={() => setSelectedMetric('humidity')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all',
              selectedMetric === 'humidity'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-zinc-400 hover:text-zinc-200'
            )}
          >
            <Wind className="w-3.5 h-3.5" />
            <span>Humidity</span>
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id={config.gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={config.color} stopOpacity={0.4} />
                <stop offset="95%" stopColor={config.color} stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />

            <XAxis 
              dataKey="time" 
              stroke="#52525b" 
              fontSize={11} 
              tickLine={false}
              axisLine={{ stroke: 'rgba(255, 255, 255, 0.08)' }}
            />

            <YAxis 
              stroke="#52525b" 
              fontSize={11} 
              tickLine={false} 
              axisLine={{ stroke: 'rgba(255, 255, 255, 0.08)' }}
              unit={config.unit}
            />

            {selectedMetric === 'moisture' && (
              <ReferenceLine 
                y={config.threshold} 
                stroke="#f59e0b" 
                strokeDasharray="4 4" 
                label={{ 
                  value: 'Trigger Threshold (30%)', 
                  fill: '#f59e0b', 
                  fontSize: 10, 
                  position: 'insideTopLeft' 
                }} 
              />
            )}

            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const p = payload[0].payload;
                  return (
                    <div className="p-3 rounded-xl bg-[#0c140f] border border-white/[0.1] shadow-xl text-xs font-mono space-y-1">
                      <div className="text-zinc-400 font-medium">{p.time}</div>
                      <div className="flex items-center gap-2 text-white">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: config.color }} />
                        <span>{config.label}:</span>
                        <span className="font-bold">{p[config.key]}{config.unit}</span>
                      </div>
                      <div className="text-[10px] text-zinc-500 pt-1 border-t border-white/[0.05]">
                        ESP8266 Verified Telemetry
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />

            <Area
              type="monotone"
              dataKey={config.key}
              stroke={config.strokeColor}
              strokeWidth={2}
              fillOpacity={1}
              fill={`url(#${config.gradientId})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
