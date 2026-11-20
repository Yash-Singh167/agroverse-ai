'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Menu, 
  Bell, 
  User, 
  LogOut, 
  Wifi, 
  WifiOff, 
  Clock, 
  ShieldCheck, 
  AlertTriangle, 
  Droplet,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTelemetry } from '@/hooks/useTelemetry';
import { cn, formatTimestamp } from '@/lib/utils';

interface TopNavbarProps {
  onMobileMenuToggle: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({ onMobileMenuToggle }) => {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { summary } = useTelemetry();

  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setCurrentDate(now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const isOnline = summary?.device?.is_online ?? true;
  const isDry = (summary?.soil_moisture?.current ?? 50) < 30;

  return (
    <header className="h-16 w-full bg-[#080d0a]/90 backdrop-blur-md border-b border-white/[0.07] px-4 sm:px-6 flex items-center justify-between z-30 sticky top-0">
      {/* Left: Mobile Toggle & Node Indicator */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.05]"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Live Hardware Node Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06] text-xs font-mono">
          {isOnline ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-zinc-300 font-medium">NODE_01</span>
              <span className="text-emerald-400 font-semibold hidden sm:inline">ONLINE</span>
              <span className="text-zinc-600 hidden md:inline">|</span>
              <span className="text-zinc-500 text-[11px] hidden md:inline">WiFi RSSI -62dBm</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-amber-400 font-medium">NODE OFFLINE</span>
            </>
          )}
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Live Digital Clock */}
        <div className="hidden md:flex items-center gap-2 text-xs font-mono text-zinc-400 px-2 py-1 rounded-lg bg-white/[0.02] border border-white/[0.04]">
          <Clock className="w-3.5 h-3.5 text-zinc-500" />
          <span>{currentDate}</span>
          <span className="text-emerald-400 font-medium">{currentTime}</span>
        </div>

        {/* Notifications Icon with popover */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserMenu(false);
            }}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-colors relative"
          >
            <Bell className="w-4 h-4" />
            {isDry && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            )}
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-[#0c140f] border border-white/[0.1] shadow-2xl p-4 z-50">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] mb-3">
                <span className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
                  Telemetry Alerts
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded">
                  2 Events
                </span>
              </div>

              <div className="space-y-2.5">
                {isDry ? (
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
                    <div className="flex items-center gap-1.5 text-amber-400 font-medium mb-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Moisture Threshold Trigger</span>
                    </div>
                    <p className="text-zinc-300 text-[11px]">
                      Soil moisture reached {summary?.soil_moisture.current}%. Below 30% safety setpoint.
                    </p>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-medium mb-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Hydrological Conditions Optimal</span>
                    </div>
                    <p className="text-zinc-300 text-[11px]">
                      Soil moisture at {summary?.soil_moisture.current}%, temperature {summary?.temperature.current}°C.
                    </p>
                  </div>
                )}

                <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs">
                  <div className="flex items-center gap-1.5 text-zinc-300 font-medium mb-1">
                    <Droplet className="w-3.5 h-3.5 text-teal-400" />
                    <span>Auto Pump Idle</span>
                  </div>
                  <p className="text-zinc-400 text-[11px]">
                    Automatic irrigation standby. Ready for edge execution.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2.5 p-1.5 pr-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] transition-colors"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 text-xs font-bold">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-medium text-zinc-200 leading-none mb-0.5">
                {user?.name || 'Agronomist'}
              </div>
              <div className="text-[10px] text-zinc-500 font-mono leading-none">
                {user?.farm_name || 'AgroVerse Farm #1'}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#0c140f] border border-white/[0.1] shadow-2xl p-2 z-50">
              <div className="px-3 py-2 border-b border-white/[0.06] mb-1">
                <p className="text-xs font-semibold text-white truncate">{user?.name || 'Farmer'}</p>
                <p className="text-[11px] text-zinc-400 font-mono truncate">{user?.email || 'farmer@agroverse.ai'}</p>
              </div>

              <Link
                href="/dashboard/settings"
                onClick={() => setShowUserMenu(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-300 hover:text-white hover:bg-white/[0.05] rounded-xl transition-colors"
              >
                <User className="w-3.5 h-3.5" />
                <span>Account &amp; Farm Settings</span>
              </Link>

              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-xl transition-colors text-left"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
