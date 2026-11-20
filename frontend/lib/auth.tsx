'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from './supabase';
import { UserProfile } from './types';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signInWithGoogle: () => Promise<{ error?: string }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
}

const LOCAL_STORAGE_KEY = 'agroverse_auth_user';

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => ({}),
  signInWithGoogle: async () => ({}),
  signUp: async () => ({}),
  signOut: async () => {},
  resetPassword: async () => ({}),
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check initial session
    const initAuth = async () => {
      try {
        if (isSupabaseConfigured && supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Farmer',
              farm_name: session.user.user_metadata?.farm_name || 'Green Valley Smart Farm',
              device_id: 'AGRO_001',
            });
            setLoading(false);
            return;
          }
        }

        // Local persistent session check
        if (typeof window !== 'undefined') {
          const savedUser = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (savedUser) {
            setUser(JSON.parse(savedUser));
          }
        }
      } catch (err) {
        console.error('Failed to restore session:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    if (isSupabaseConfigured && supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Farmer',
            farm_name: session.user.user_metadata?.farm_name || 'Green Valley Smart Farm',
            device_id: 'AGRO_001',
          });
        } else {
          setUser(null);
        }
      });
      return () => subscription.unsubscribe();
    }
  }, []);

  const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
    setLoading(true);
    try {
      if (email === 'demo.farmer@agroverse.ai' && password === 'SmartFarm2026!') {
        const dummyUser: UserProfile = {
          id: 'demo_user',
          email,
          name: 'Demo Agronomist',
          farm_name: 'AgroVerse Precision Farm #1',
          device_id: 'AGRO_001',
        };

        if (typeof window !== 'undefined') {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dummyUser));
        }
        setUser(dummyUser);
        return {};
      }

      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return { error: error.message };
        return {};
      }

      // Local high-fidelity auth mode for instant dev / demo
      // Simple validation
      if (!email.includes('@')) {
        return { error: 'Please enter a valid email address.' };
      }
      if (password.length < 6) {
        return { error: 'Password must be at least 6 characters.' };
      }

      const dummyUser: UserProfile = {
        id: 'user_' + Math.random().toString(36).substring(2, 9),
        email,
        name: email.split('@')[0].replace('.', ' ').toUpperCase(),
        farm_name: 'AgroVerse Precision Farm #1',
        device_id: 'AGRO_001',
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dummyUser));
      }
      setUser(dummyUser);
      return {};
    } catch (err: any) {
      return { error: err.message || 'An unexpected error occurred during login.' };
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async (): Promise<{ error?: string }> => {
    if (!isSupabaseConfigured || !supabase) {
      return {
        error: 'Google sign-in requires Supabase configuration. Add its URL and public anon key to frontend/.env.local, then enable Google in Supabase Auth.',
      };
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          queryParams: { prompt: 'select_account' },
        },
      });
      if (error) return { error: error.message };
      return {};
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Google sign-in could not be started.' };
    }
  };

  const signUp = async (email: string, password: string, name: string): Promise<{ error?: string }> => {
    setLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name, farm_name: 'AgroVerse Smart Farm' }
          }
        });
        if (error) return { error: error.message };
        return {};
      }

      if (!email.includes('@')) {
        return { error: 'Please enter a valid email address.' };
      }
      if (password.length < 8) {
        return { error: 'Password must be at least 8 characters for security.' };
      }

      const newUser: UserProfile = {
        id: 'user_' + Math.random().toString(36).substring(2, 9),
        email,
        name: name || email.split('@')[0],
        farm_name: 'AgroVerse Precision Farm #1',
        device_id: 'AGRO_001',
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newUser));
      }
      setUser(newUser);
      return {};
    } catch (err: any) {
      return { error: err.message || 'Failed to create account.' };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
    setUser(null);
  };

  const resetPassword = async (email: string): Promise<{ error?: string }> => {
    if (!email.includes('@')) {
      return { error: 'Please enter a valid email address.' };
    }
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) return { error: error.message };
    }
    return {};
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signInWithGoogle, signUp, signOut, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
