'use client';

import React from 'react';
import { History, Droplet, Clock, CheckCircle2, AlertOctagon } from 'lucide-react';
import { IrrigationEventRecord } from '@/lib/types';
import { formatRelativeTime, cn } from '@/lib/utils';
import Link from 'next/link';

interface ActivityTimelineProps {
  events: IrrigationEventRecord[];
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ events }) => {
  return (
    <div className="p-6 rounded-2xl bg-[#0f1712]/70 border border-white/[0.08] backdrop-blur-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider font-mono">
            Irrigation Activity Log
          </h3>
        </div>
        <Link 
          href="/dashboard/history" 
          className="text-xs text-emerald-400 hover:text-emerald-300 font-mono transition-colors"
        >
          View all logs &rarr;
        </Link>
      </div>

      <div className="space-y-3">
        {events.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-500 font-mono">
            No recent pump actuations recorded yet today.
          </div>
        ) : (
          events.slice(0, 4).map((evt) => {
            const isAuto = evt.triggered_by.includes('auto');
            return (
              <div
                key={evt.id}
                className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.1] transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border',
                    isAuto 
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                      : 'bg-teal-500/10 border-teal-500/20 text-teal-400'
                  )}>
                    <Droplet className="w-4 h-4" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-zinc-200">
                        {isAuto ? 'Auto Threshold Cycle' : 'Manual Irrigation Run'}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/[0.04] text-zinc-400 border border-white/[0.06]">
                        {evt.duration_seconds ? `${evt.duration_seconds}s` : 'Cycle'}
                      </span>
                    </div>

                    <div className="text-[11px] text-zinc-400 flex items-center gap-2 mt-0.5 font-mono">
                      <span>Volume: {evt.water_volume_liters ? `${evt.water_volume_liters} L` : 'N/A'}</span>
                      {evt.moisture_before && evt.moisture_after && (
                        <>
                          <span>·</span>
                          <span className="text-emerald-400">
                            {evt.moisture_before}% &rarr; {evt.moisture_after}%
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] font-mono text-zinc-500">
                    {formatRelativeTime(evt.timestamp)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
