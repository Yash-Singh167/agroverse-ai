'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Sprout } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 text-emerald-400">
      <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 shadow-glow animate-pulse">
        <Sprout className="w-8 h-8 text-emerald-400" />
      </div>
      <p className="text-sm font-mono text-zinc-400 tracking-wider uppercase">Loading AgroVerse AI...</p>
    </div>
  );
}
