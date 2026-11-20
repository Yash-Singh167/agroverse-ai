'use client';

import React, { useState } from 'react';
import { 
  History as HistoryIcon, 
  Droplet, 
  Download, 
  Trash2, 
  Search, 
  Filter, 
  Clock, 
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { useTelemetry } from '@/hooks/useTelemetry';
import { formatTimestamp, cn } from '@/lib/utils';

export default function HistoryPage() {
  const { events, clearHistory } = useTelemetry();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'auto' | 'manual'>('all');

  const filteredEvents = events.filter((evt) => {
    const matchesSearch = 
      evt.triggered_by.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evt.device_id.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterType === 'auto') return matchesSearch && evt.triggered_by.includes('auto');
    if (filterType === 'manual') return matchesSearch && evt.triggered_by.includes('manual');
    return matchesSearch;
  });

  const exportCSV = () => {
    if (events.length === 0) return;
    const headers = 'ID,Device,Event,Trigger,Duration_Seconds,Water_Liters,Moisture_Before,Moisture_After,Timestamp\n';
    const rows = events.map((e) => 
      `"${e.id}","${e.device_id}","${e.event_type}","${e.triggered_by}","${e.duration_seconds || 0}","${e.water_volume_liters || 0}","${e.moisture_before || ''}","${e.moisture_after || ''}","${e.timestamp}"`
    ).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agroverse_irrigation_history_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Irrigation Event History &amp; Audit Logs
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Audit Trail
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Complete cryptographic chronological record of relay actuations, volume dispensed, and hydration impact.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={exportCSV}
            disabled={events.length === 0}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] text-xs font-mono text-zinc-300 transition-colors disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={clearHistory}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-mono transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset Logs</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-[#0f1712]/70 border border-white/[0.08] backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search triggers or events..."
            className="w-full bg-[#111a14] border border-white/[0.08] focus:border-emerald-500/50 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 outline-none font-mono"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center p-1 rounded-xl bg-black/40 border border-white/[0.08] text-xs font-mono self-start sm:self-auto">
          {(['all', 'auto', 'manual'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={cn(
                'px-3 py-1.5 rounded-lg uppercase transition-all',
                filterType === type
                  ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30'
                  : 'text-zinc-400 hover:text-white'
              )}
            >
              {type === 'all' ? 'All Events' : type === 'auto' ? 'Auto Threshold' : 'Manual Run'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-[#0f1712]/70 border border-white/[0.08] backdrop-blur-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="border-b border-white/[0.06] bg-black/30 text-zinc-400 uppercase text-[10px] tracking-wider">
                <th className="py-3.5 px-4 font-semibold">Timestamp</th>
                <th className="py-3.5 px-4 font-semibold">Event Type</th>
                <th className="py-3.5 px-4 font-semibold">Trigger Cause</th>
                <th className="py-3.5 px-4 font-semibold">Duration</th>
                <th className="py-3.5 px-4 font-semibold">Volume</th>
                <th className="py-3.5 px-4 font-semibold">Soil Moisture Impact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-500">
                    No historical irrigation events match your filter.
                  </td>
                </tr>
              ) : (
                filteredEvents.map((evt) => {
                  const isAuto = evt.triggered_by.includes('auto');
                  return (
                    <tr key={evt.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 text-zinc-300 whitespace-nowrap">
                        {formatTimestamp(evt.timestamp)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={cn(
                          'px-2 py-0.5 rounded text-[10px] uppercase font-bold border',
                          evt.event_type === 'start'
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                        )}>
                          {evt.event_type === 'start' ? 'Pump Energized' : 'Cycle Ended'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-zinc-200 capitalize whitespace-nowrap">
                        {evt.triggered_by.replace('_', ' ')}
                      </td>
                      <td className="py-3 px-4 text-zinc-400 whitespace-nowrap">
                        {evt.duration_seconds ? `${evt.duration_seconds}s` : 'Cycle'}
                      </td>
                      <td className="py-3 px-4 text-teal-400 font-bold whitespace-nowrap">
                        {evt.water_volume_liters ? `${evt.water_volume_liters} L` : '—'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {evt.moisture_before ? (
                          <span className="text-zinc-300">
                            {evt.moisture_before}%{' '}
                            {evt.moisture_after ? (
                              <span className="text-emerald-400 font-bold">
                                &rarr; {evt.moisture_after}% (+{(evt.moisture_after - evt.moisture_before).toFixed(1)}%)
                              </span>
                            ) : ''}
                          </span>
                        ) : (
                          <span className="text-zinc-500">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
