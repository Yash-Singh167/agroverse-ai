import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'AgroVerse AI — Smart Irrigation & Precision Agriculture',
  description: 'Next-generation IoT & AI powered smart irrigation system with 3D farm digital twin and autonomous environmental control.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-emerald-500/20 selection:text-emerald-300">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
