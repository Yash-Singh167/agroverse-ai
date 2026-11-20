'use client';

import React from 'react';
import Link from 'next/link';
import { Sprout, Activity, Cpu, Droplets, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#080c09] text-foreground font-sans">
      {/* Left Column: Cinematic Visual & Value Props */}
      <div className="relative hidden lg:flex lg:w-1/2 xl:w-7/12 flex-col justify-between p-12 overflow-hidden border-r border-white/[0.06] bg-gradient-to-br from-[#070b08] via-[#0b1510] to-[#040806]">
        {/* Subtle Ambient Gradients & Grid */}
        <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" />
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shadow-glow">
            <Sprout className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-white">AGROVERSE</span>
              <span className="px-1.5 py-0.5 text-[10px] font-mono tracking-widest uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded">
                AI IoT
              </span>
            </div>
            <p className="text-xs text-zinc-400">Autonomous Agricultural Hydrology Platform</p>
          </div>
        </div>

        {/* Centerpiece: Interactive Visual Card Preview */}
        <div className="relative z-10 my-auto py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-lg"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono mb-6">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              ESP8266 Live Node Connected · Hardware Synchronized
            </div>

            <h1 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-tight mb-4">
              Precision irrigation powered by <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">IoT telemetry</span> &amp; 3D digital twins.
            </h1>

            <p className="text-zinc-400 text-sm leading-relaxed mb-8">
              Continuous soil moisture sensing, predictive hydration analytics, and automated solenoid pump actuation designed for zero-waste smart farming.
            </p>

            {/* Live Metrics Showcase */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-sm">
                <div className="flex items-center gap-2 text-emerald-400 text-xs mb-1 font-mono">
                  <Activity className="w-3.5 h-3.5" />
                  <span>Telemetry</span>
                </div>
                <div className="text-lg font-bold text-zinc-100">&lt; 100ms</div>
                <div className="text-[11px] text-zinc-500">WebSocket sync</div>
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-sm">
                <div className="flex items-center gap-2 text-teal-400 text-xs mb-1 font-mono">
                  <Droplets className="w-3.5 h-3.5" />
                  <span>Conservation</span>
                </div>
                <div className="text-lg font-bold text-zinc-100">38.4%</div>
                <div className="text-[11px] text-zinc-500">Water saved</div>
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-sm">
                <div className="flex items-center gap-2 text-emerald-400 text-xs mb-1 font-mono">
                  <Cpu className="w-3.5 h-3.5" />
                  <span>Edge Relay</span>
                </div>
                <div className="text-lg font-bold text-zinc-100">ESP8266</div>
                <div className="text-[11px] text-zinc-500">Fail-safe control</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom Feature Badges */}
        <div className="relative z-10 flex items-center justify-between text-xs text-zinc-500 border-t border-white/[0.06] pt-6">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" /> End-to-end token validation
            </span>
            <span>·</span>
            <span>Local automatic failover</span>
          </div>
          <span className="font-mono text-[11px]">v1.0.0 Prod</span>
        </div>
      </div>

      {/* Right Column: Minimal Form Panel */}
      <div className="w-full lg:w-1/2 xl:w-5/12 flex flex-col justify-center px-6 sm:px-12 lg:px-16 py-12 relative bg-[#090d0b]">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
            <Sprout className="w-5 h-5 text-emerald-400" />
          </div>
          <span className="font-bold text-lg text-white">AGROVERSE AI</span>
        </div>

        <div className="w-full max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="mb-8">
              <h2 className="text-2xl font-bold tracking-tight text-white mb-2">{title}</h2>
              <p className="text-sm text-zinc-400">{subtitle}</p>
            </div>

            {children}
          </motion.div>
        </div>

        <div className="mt-auto pt-8 text-center text-xs text-zinc-500">
          AgroVerse AI Systems &copy; {new Date().getFullYear()} · Precision Smart Agriculture
        </div>
      </div>
    </div>
  );
};
