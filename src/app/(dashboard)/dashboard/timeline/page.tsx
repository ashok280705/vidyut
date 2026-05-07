'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/stores/app-store';
import { cn, timeAgo } from '@/lib/utils';
import { 
  Clock, Filter, AlertTriangle, ShieldCheck, Cpu, 
  Settings, Zap, HardHat, Search, Calendar
} from 'lucide-react';
import type { ActivityLog } from '@/types';

const TYPE_ICONS: Record<string, React.ElementType> = {
  anomaly: AlertTriangle,
  inspection: HardHat,
  system: Cpu,
  admin: Settings,
  grid: Zap,
  security: ShieldCheck
};

export default function TimelinePage() {
  const { activity } = useAppStore();
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const filteredActivity = activity.filter(item => {
    if (filter !== 'all' && item.type !== filter) return false;
    if (search && !item.title.toLowerCase().includes(search.toLowerCase()) && !item.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-[family-name:var(--font-outfit)] tracking-tight">Operational Timeline Engine</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Chronological record of all system events, AI inferences, and grid alerts</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search timeline..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-black/40 border border-white/[0.06] rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-primary transition-colors w-64"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-black/40 border border-white/[0.06] hover:bg-white/[0.04] transition-colors">
            <Calendar className="h-4 w-4" /> <span className="text-sm font-medium">Date Range</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
        {['all', 'anomaly', 'grid', 'inspection', 'system', 'admin'].map(t => (
          <button 
            key={t}
            onClick={() => setFilter(t)}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap",
              filter === t 
                ? "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(0,229,255,0.4)]" 
                : "bg-white/[0.04] hover:bg-white/[0.08] text-muted-foreground"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Timeline View */}
      <div className="glass-card rounded-xl p-8">
        <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/[0.1] before:to-transparent">
          {filteredActivity.map((item, i) => {
            const Icon = TYPE_ICONS[item.type] || Clock;
            const isLeft = i % 2 === 0;

            return (
              <div key={item.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                {/* Icon Marker */}
                <div className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full border-4 border-[hsl(222,47%,6%)] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-[0_0_10px_rgba(0,0,0,0.5)] z-10 transition-transform duration-300 group-hover:scale-110",
                  item.severity === 'critical' ? 'bg-red-500' :
                  item.severity === 'warning' ? 'bg-amber-500' : 
                  item.type === 'system' ? 'bg-purple-500' : 'bg-primary'
                )}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
                
                {/* Content Card */}
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl glass-card hover:bg-white/[0.04] transition-colors border border-white/[0.06] group-hover:border-primary/50 relative">
                  {/* Pointer arrow */}
                  <div className={cn(
                    "absolute top-5 w-3 h-3 bg-[hsl(222,47%,8%)] border-t border-l border-white/[0.06] transform rotate-45 -mt-1.5",
                    "md:group-even:-right-1.5 md:group-even:border-b-0 md:group-even:border-l-0 md:group-even:border-t md:group-even:border-r",
                    "md:group-odd:-left-1.5 md:group-odd:border-r-0 md:group-odd:border-b-0 md:group-odd:border-t md:group-odd:border-l",
                    "group-hover:border-primary/50 transition-colors hidden md:block"
                  )} />

                  <div className="flex items-center justify-between mb-2">
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded",
                      item.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                      item.severity === 'warning' ? 'bg-amber-500/20 text-amber-400' : 
                      'bg-white/[0.1] text-muted-foreground'
                    )}>
                      {item.type}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">{new Date(item.timestamp).toLocaleString('en-IN')}</span>
                  </div>
                  
                  <h3 className={cn("text-base font-bold mb-1", item.severity === 'critical' && 'text-red-400')}>{item.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
                  
                  {item.metadata && (
                    <div className="bg-black/40 rounded p-2 text-[10px] font-mono text-muted-foreground border border-white/[0.04]">
                      {JSON.stringify(item.metadata)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          
          {filteredActivity.length === 0 && (
            <div className="py-20 text-center text-muted-foreground">
              <Clock className="h-10 w-10 mx-auto mb-4 opacity-20" />
              <p>No timeline events match the current filter.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
