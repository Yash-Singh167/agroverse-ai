'use client';

import React from 'react';
import { Bot, Sparkles, AlertCircle, CheckCircle, Clock, ArrowRight, ShieldCheck } from 'lucide-react';
import { AIPrediction } from '@/lib/types';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface AIPredictionCardProps {
  prediction: AIPrediction | null;
}

export const AIPredictionCard: React.FC<AIPredictionCardProps> = ({ prediction }) => {
  const isRequired = prediction?.irrigation_required ?? false;
  const priority = prediction?.priority ?? 'low';
  const confidence = Math.round((prediction?.confidence ?? 0.88) * 100);

  const priorityColor = {
    low: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    high: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    critical: 'text-red-400 bg-red-500/10 border-red-500/20',
  }[priority];

  return (
    <div className="p-6 rounded-2xl bg-gradient-to-br from-[#101c15] to-[#0a120e] border border-white/[0.08] relative overflow-hidden flex flex-col justify-between">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shadow-glow">
              <Bot className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
                  Agro AI Engine
                </span>
                <span className="px-1.5 py-0.2 text-[9px] font-mono uppercase bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">
                  Recommendation
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 font-mono">Autonomous Hydrology Decision Model</p>
            </div>
          </div>

          <span className={cn('text-[11px] font-mono px-2.5 py-1 rounded-full border uppercase tracking-wider font-semibold', priorityColor)}>
            Priority: {priority}
          </span>
        </div>

        {/* Prediction Verdict */}
        <div className="my-4 p-4 rounded-xl bg-black/30 border border-white/[0.06] backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-zinc-400 uppercase">Irrigation Decision:</span>
            <span className="text-xs font-mono text-zinc-400">Confidence: <strong className="text-emerald-400">{confidence}%</strong></span>
          </div>

          <div className="flex items-center gap-3">
            {isRequired ? (
              <div className="flex items-center gap-2 text-amber-400 font-bold text-lg font-mono">
                <AlertCircle className="w-5 h-5" />
                <span>IRRIGATION REQUIRED</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-lg font-mono">
                <CheckCircle className="w-5 h-5" />
                <span>OPTIMAL · IRRIGATION NOT REQUIRED</span>
              </div>
            )}
          </div>

          {/* Recommendation rationale */}
          <p className="mt-3 text-xs text-zinc-300 leading-relaxed">
            {prediction?.reason || 'Soil moisture is currently within healthy vegetative tolerance. Evapotranspiration rate is subdued.'}
          </p>
        </div>

        {/* Meta details: suggested duration & soil drying trend */}
        <div className="grid grid-cols-2 gap-3 text-xs font-mono">
          <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
            <div className="text-[10px] text-zinc-500 uppercase mb-0.5">Soil Moisture Trend</div>
            <div className="text-zinc-200 capitalize font-medium">
              {prediction?.soil_trend?.replace('_', ' ') || 'Slowly drying'}
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
            <div className="text-[10px] text-zinc-500 uppercase mb-0.5">Suggested Runtime</div>
            <div className="text-emerald-400 font-medium">
              {prediction?.suggested_duration_seconds ? `${prediction.suggested_duration_seconds}s (Calibrated)` : '0s (Standby)'}
            </div>
          </div>
        </div>
      </div>

      {/* Footer link to AI Assistant */}
      <div className="mt-5 pt-3 border-t border-white/[0.06] flex items-center justify-between">
        <span className="text-[10px] font-mono text-zinc-500 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          Rule-based v1.0 Engine
        </span>

        <Link
          href="/dashboard/ai"
          className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
        >
          <span>Consult Agro AI</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
