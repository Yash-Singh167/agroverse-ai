'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Sprout, 
  Bot, 
  LineChart, 
  Droplet, 
  History, 
  Settings, 
  Cpu, 
  Wifi, 
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTelemetry } from '@/hooks/useTelemetry';

interface SidebarProps {
  onMobileClose?: () => void;
}

const NAV_ITEMS = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Live 3D Farm', href: '/dashboard/farm', icon: Sprout, badge: '3D' },
  { name: 'AI Assistant', href: '/dashboard/ai', icon: Bot, badge: 'Agro AI' },
  { name: 'Sensor Analytics', href: '/dashboard/analytics', icon: LineChart },
  { name: 'Irrigation Control', href: '/dashboard/irrigation', icon: Droplet },
  { name: 'Event History', href: '/dashboard/history', icon: History },
  { name: 'System Settings', href: '/dashboard/settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ onMobileClose }) => {
  const pathname = usePathname();
  const { summary } = useTelemetry();

  const isOnline = summary?.device?.is_online ?? true;
  const pumpActive = summary?.pump?.state ?? false;

  return (
    <aside className="w-64 h-full flex flex-col justify-between bg-[#080d0a] border-r border-white/[0.07] select-none">
      <div>
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-white/[0.06]">
          <Link 
            href="/dashboard" 
            className="flex items-center gap-2.5 group"
            onClick={onMobileClose}
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center group-hover:scale-105 transition-transform shadow-glow">
              <Sprout className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-tight text-white">AGROVERSE</span>
                <span className="px-1 py-0.2 text-[9px] font-mono uppercase bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">
                  AI
                </span>
              </div>
              <p className="text-[10px] text-zinc-500 tracking-wider uppercase font-mono">Precision IoT</p>
            </div>
          </Link>
        </div>

        {/* Navigation Section */}
        <div className="px-3 py-4">
          <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 px-3 mb-2">
            Command Center
          </div>

          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onMobileClose}
                  className={cn(
                    'group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150',
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 shadow-glow'
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04]'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={cn('w-4 h-4 transition-colors', isActive ? 'text-emerald-400' : 'text-zinc-500 group-hover:text-zinc-300')} />
                    <span>{item.name}</span>
                  </div>

                  {item.badge && (
                    <span className={cn(
                      'text-[9px] font-mono px-1.5 py-0.5 rounded border',
                      isActive
                        ? 'bg-emerald-500/30 text-emerald-200 border-emerald-400/30'
                        : 'bg-white/[0.04] text-zinc-500 border-white/[0.06]'
                    )}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Hardware Node Status Card in Footer */}
      <div className="p-3 border-t border-white/[0.06] bg-[#070b08]/80">
        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-xs font-mono font-medium text-zinc-200">ESP8266-01</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={cn(
                'w-2 h-2 rounded-full',
                isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              )} />
              <span className="text-[10px] font-mono text-zinc-400">
                {isOnline ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1 border-t border-white/[0.04]">
            <span className="font-mono text-zinc-500">Pump Actuator:</span>
            <span className={cn(
              'font-mono font-semibold',
              pumpActive ? 'text-emerald-400 animate-pulse' : 'text-zinc-500'
            )}>
              {pumpActive ? 'ACTUATED (ON)' : 'STANDBY (OFF)'}
            </span>
          </div>

          <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
            <span>Node ID: {summary?.device?.device_id || 'AGRO_001'}</span>
            <span>FW v1.0</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
