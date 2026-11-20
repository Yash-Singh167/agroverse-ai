'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { TopNavbar } from '@/components/dashboard/TopNavbar';
import { TelemetryProvider } from '@/lib/telemetryContext';
import { Sprout, X } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b08] flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shadow-glow animate-pulse">
          <Sprout className="w-6 h-6 text-emerald-400" />
        </div>
        <p className="text-xs font-mono uppercase tracking-widest text-zinc-500">
          Syncing Farm Node Security Context...
        </p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <TelemetryProvider>
      <div className="min-h-screen flex bg-[#070b08] text-foreground font-sans">
        {/* Desktop Persistent Sidebar */}
        <div className="hidden lg:block w-64 h-screen sticky top-0 shrink-0 z-40">
          <Sidebar />
        </div>

        {/* Mobile Drawer Backdrop */}
        {mobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div 
              className="w-64 h-full bg-[#080d0a] shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white bg-white/[0.05]"
              >
                <X className="w-4 h-4" />
              </button>
              <Sidebar onMobileClose={() => setMobileMenuOpen(false)} />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <TopNavbar onMobileMenuToggle={() => setMobileMenuOpen(true)} />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </TelemetryProvider>
  );
}
