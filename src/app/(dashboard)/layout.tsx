'use client';
import { useEffect } from 'react';
import Sidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';
import { useAppStore } from '@/stores/app-store';
import { ToastProvider } from '@/components/ui/toast';
import { RealtimeManager } from '@/components/realtime-manager';
import { CommandPalette } from '@/components/ui/command-palette';
import { PageTransition } from '@/components/ui/page-transition';
import { cn } from '@/lib/utils';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { sidebarOpen, init, initialized } = useAppStore();

  useEffect(() => { init(); }, [init]);

  if (!initialized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="h-14 w-14 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(0,229,255,0.2)]">
            <span className="text-primary font-bold text-2xl font-[family-name:var(--font-outfit)]">V</span>
          </div>
          <p className="text-sm text-muted-foreground animate-pulse">Initializing VIDYUT Intelligence Platform...</p>
          <div className="mt-4 flex items-center gap-1.5 justify-center">
            <div className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
            <div className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
            <div className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <RealtimeManager />
      <CommandPalette />
      <div className="min-h-screen bg-background">
        <Sidebar />
        <div className={cn(
          'transition-all duration-300 ease-in-out',
          sidebarOpen ? 'ml-64' : 'ml-[72px]'
        )}>
          <Header />
          <main className="p-6">
            <PageTransition>
              {children}
            </PageTransition>
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
