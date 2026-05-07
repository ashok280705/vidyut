'use client';
import { useAppStore } from '@/stores/app-store';
import { useAuth } from '@/hooks/use-auth';
import { Bell, Search, Cloud, Thermometer, Droplets, User, RefreshCw } from 'lucide-react';
import { cn, timeAgo } from '@/lib/utils';
import { useState, useEffect, useCallback } from 'react';

export default function Header() {
  const { weather, notifications, notificationsPanelOpen, setNotificationsPanelOpen, refreshData } = useAppStore();
  const { user } = useAuth();
  const [time, setTime] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    setTime(new Date());
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    refreshData();
    setTimeout(() => setIsRefreshing(false), 1000);
  }, [refreshData]);

  const criticalCount = notifications.filter(n => n.severity === 'critical').length;

  return (
    <header className="sticky top-0 z-30 h-14 border-b border-white/[0.06] glass flex items-center justify-between px-6">
      {/* Left: Search */}
      <div className="flex items-center gap-4">
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-sm text-muted-foreground hover:border-primary/30 transition-colors min-w-[240px]">
          <Search className="h-3.5 w-3.5" />
          <span>Search meters, feeders, anomalies...</span>
          <kbd className="ml-auto text-[10px] bg-white/[0.06] px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
        </button>
      </div>

      {/* Center: Live Status */}
      <div className="hidden lg:flex items-center gap-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-emerald-400 font-medium">LIVE</span>
        </div>
        {weather && (
          <>
            <div className="flex items-center gap-1.5">
              <Cloud className="h-3.5 w-3.5" />
              <span>{weather.condition}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Thermometer className="h-3.5 w-3.5" />
              <span>{(weather.temperature_c ?? 0).toFixed(1)}°C</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Droplets className="h-3.5 w-3.5" />
              <span>{(weather.humidity_percent ?? 0).toFixed(0)}%</span>
            </div>
          </>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground font-mono tabular-nums">
          {time ? `${time.toLocaleTimeString('en-IN', { hour12: false })} IST` : '--:--:-- IST'}
        </span>

        <button onClick={handleRefresh}
          className="p-2 rounded-lg hover:bg-white/[0.04] text-muted-foreground hover:text-foreground transition-colors">
          <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
        </button>

        {/* Notifications */}
        <div className="relative">
          <button onClick={() => setNotificationsPanelOpen(!notificationsPanelOpen)}
            className="p-2 rounded-lg hover:bg-white/[0.04] text-muted-foreground hover:text-foreground transition-colors relative">
            <Bell className="h-4 w-4" />
            {criticalCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center animate-pulse-glow">
                {criticalCount}
              </span>
            )}
          </button>

          {notificationsPanelOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 glass-card rounded-xl overflow-hidden animate-slide-up">
              <div className="p-3 border-b border-white/[0.06] flex items-center justify-between">
                <span className="text-sm font-semibold">Notifications</span>
                <span className="text-[10px] text-muted-foreground">{notifications.length} new</span>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.map((n) => (
                  <div key={n.id} className="px-3 py-2.5 border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-start gap-2">
                      <span className={cn('mt-1 h-1.5 w-1.5 rounded-full flex-shrink-0',
                        n.severity === 'critical' ? 'bg-red-500' : n.severity === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                      )} />
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate">{n.title}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{n.description}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{timeAgo(n.timestamp)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User */}
        <button className="flex items-center gap-2 pl-3 border-l border-white/[0.06]">
          <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
            ) : (
              <User className="h-3.5 w-3.5 text-primary" />
            )}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-medium truncate max-w-[120px]">{user?.name || 'Loading...'}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-tight">{user?.role || 'User'}</p>
          </div>
        </button>
      </div>
    </header>
  );
}
