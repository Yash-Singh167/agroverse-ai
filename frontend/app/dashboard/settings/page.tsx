'use client';

import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  User, 
  Sprout, 
  Cpu, 
  Sliders, 
  Bot, 
  Bell, 
  ShieldCheck, 
  Check, 
  Palette 
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTelemetry } from '@/hooks/useTelemetry';

export default function SettingsPage() {
  const { user } = useAuth();
  const { summary, updateThresholds } = useTelemetry();

  const [farmName, setFarmName] = useState(user?.farm_name || 'AgroVerse Precision Farm #1');
  const [userName, setUserName] = useState(user?.name || 'Dr. Sarah Jenkins');
  const [lowThresh, setLowThresh] = useState(summary.soil_moisture.threshold_low);
  const [highThresh, setHighThresh] = useState(summary.soil_moisture.threshold_high);
  const [maxRuntime, setMaxRuntime] = useState(600);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateThresholds(Number(lowThresh), Number(highThresh));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              System Settings &amp; Node Configuration
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Preferences
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Manage your agronomist profile, hardware setpoints, and Agro AI assistant parameters.
          </p>
        </div>

        {saved && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-mono">
            <Check className="w-4 h-4" />
            <span>Settings Saved!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: User Profile & Farm Name */}
        <div className="p-6 rounded-2xl bg-[#0f1712]/70 border border-white/[0.08] backdrop-blur-md space-y-4">
          <div className="flex items-center gap-2 text-zinc-200 font-semibold text-xs font-mono uppercase tracking-wider pb-3 border-b border-white/[0.06]">
            <User className="w-4 h-4 text-emerald-400" />
            <span>Agronomist Identity &amp; Farm Domain</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div>
              <label className="block text-zinc-400 uppercase text-[10px] mb-1.5">User Display Name</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full bg-[#111a14] border border-white/[0.08] focus:border-emerald-500/50 rounded-xl px-3 py-2 text-zinc-100 outline-none"
              />
            </div>

            <div>
              <label className="block text-zinc-400 uppercase text-[10px] mb-1.5">Farm Facility Name</label>
              <input
                type="text"
                value={farmName}
                onChange={(e) => setFarmName(e.target.value)}
                className="w-full bg-[#111a14] border border-white/[0.08] focus:border-emerald-500/50 rounded-xl px-3 py-2 text-zinc-100 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Hardware Node Calibration */}
        <div className="p-6 rounded-2xl bg-[#0f1712]/70 border border-white/[0.08] backdrop-blur-md space-y-4">
          <div className="flex items-center gap-2 text-zinc-200 font-semibold text-xs font-mono uppercase tracking-wider pb-3 border-b border-white/[0.06]">
            <Cpu className="w-4 h-4 text-teal-400" />
            <span>Hardware Setpoints &amp; Fail-Safe Timers</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
            <div>
              <label className="block text-zinc-400 uppercase text-[10px] mb-1.5">Low Moisture Setpoint (%)</label>
              <input
                type="number"
                min="5"
                max="50"
                value={lowThresh}
                onChange={(e) => setLowThresh(Number(e.target.value))}
                className="w-full bg-[#111a14] border border-white/[0.08] focus:border-emerald-500/50 rounded-xl px-3 py-2 text-amber-400 font-bold outline-none"
              />
              <span className="text-[10px] text-zinc-500 mt-1 block">Auto-irrigation trigger baseline</span>
            </div>

            <div>
              <label className="block text-zinc-400 uppercase text-[10px] mb-1.5">High Moisture Target (%)</label>
              <input
                type="number"
                min="50"
                max="95"
                value={highThresh}
                onChange={(e) => setHighThresh(Number(e.target.value))}
                className="w-full bg-[#111a14] border border-white/[0.08] focus:border-emerald-500/50 rounded-xl px-3 py-2 text-sky-400 font-bold outline-none"
              />
              <span className="text-[10px] text-zinc-500 mt-1 block">Saturation shutoff target</span>
            </div>

            <div>
              <label className="block text-zinc-400 uppercase text-[10px] mb-1.5">Max Continuous Runtime (s)</label>
              <input
                type="number"
                min="60"
                max="1800"
                value={maxRuntime}
                onChange={(e) => setMaxRuntime(Number(e.target.value))}
                className="w-full bg-[#111a14] border border-white/[0.08] focus:border-emerald-500/50 rounded-xl px-3 py-2 text-emerald-400 font-bold outline-none"
              />
              <span className="text-[10px] text-zinc-500 mt-1 block">Hardware burnout fail-safe</span>
            </div>
          </div>
        </div>

        {/* Section 3: AI Preferences */}
        <div className="p-6 rounded-2xl bg-[#0f1712]/70 border border-white/[0.08] backdrop-blur-md space-y-4">
          <div className="flex items-center gap-2 text-zinc-200 font-semibold text-xs font-mono uppercase tracking-wider pb-3 border-b border-white/[0.06]">
            <Bot className="w-4 h-4 text-emerald-400" />
            <span>Agro AI Consultant Model Settings</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div>
              <label className="block text-zinc-400 uppercase text-[10px] mb-1.5">AI Engine Mode</label>
              <select className="w-full bg-[#111a14] border border-white/[0.08] focus:border-emerald-500/50 rounded-xl px-3 py-2 text-zinc-200 outline-none">
                <option value="dual">Hybrid (Edge Agronomy Model + LLM Fallback)</option>
                <option value="local">Autonomous Offline Edge Mode</option>
                <option value="gemini">Google Gemini 1.5 Flash Cloud</option>
              </select>
            </div>

            <div>
              <label className="block text-zinc-400 uppercase text-[10px] mb-1.5">Hydrological Tone</label>
              <select className="w-full bg-[#111a14] border border-white/[0.08] focus:border-emerald-500/50 rounded-xl px-3 py-2 text-zinc-200 outline-none">
                <option value="expert">Senior Agronomist &amp; Hydrologist</option>
                <option value="concise">Concise Operational Bullet Points</option>
                <option value="simple">Simple Farmer Friendly</option>
              </select>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-medium text-xs font-mono shadow-glow transition-all cursor-pointer"
          >
            Save All Preferences
          </button>
        </div>
      </form>
    </div>
  );
}
