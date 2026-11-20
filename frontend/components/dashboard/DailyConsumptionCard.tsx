'use client';

import React from 'react';
import { Droplet, Leaf, TrendingDown, Award } from 'lucide-react';

interface DailyConsumptionCardProps {
  litersToday: number;
  runtimeSeconds: number;
}

export const DailyConsumptionCard: React.FC<DailyConsumptionCardProps> = ({
  litersToday,
  runtimeSeconds,
}) => {
  const runtimeMinutes = (runtimeSeconds / 60).toFixed(1);
  const targetLiters = 45.0;
  const percentageOfBudget = Math.min(100, Math.round((litersToday / targetLiters) * 100));

  return (
    <div className="p-6 rounded-2xl bg-[#0f1712]/70 border border-white/[0.08] backdrop-blur-md flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Droplet className="w-4 h-4 text-teal-400" />
            <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider font-mono">
              Water Consumption
            </h3>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/30 uppercase">
            Today
          </span>
        </div>

        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-3xl font-extrabold font-mono text-white">
            {litersToday.toFixed(1)}
          </span>
          <span className="text-sm font-medium text-zinc-400 font-mono">Liters</span>
        </div>

        <p className="text-xs text-zinc-400 mb-4">
          Allocated daily budget: <span className="font-mono text-zinc-200">{targetLiters} L</span> ({percentageOfBudget}% utilized)
        </p>

        {/* Consumption Bar */}
        <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden mb-4">
          <div 
            className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-400"
            style={{ width: `${percentageOfBudget}%` }}
          />
        </div>
      </div>

      {/* Highlights */}
      <div className="pt-3 border-t border-white/[0.05] grid grid-cols-2 gap-3 text-xs font-mono">
        <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
          <div className="text-[10px] text-zinc-500 uppercase">Actuation Duration</div>
          <div className="text-zinc-200 font-medium">{runtimeMinutes} mins</div>
        </div>

        <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
          <div className="text-[10px] text-zinc-500 uppercase flex items-center gap-1">
            <TrendingDown className="w-3 h-3 text-emerald-400" /> Water Saved
          </div>
          <div className="text-emerald-400 font-medium">+36.2% Saved</div>
        </div>
      </div>
    </div>
  );
};
