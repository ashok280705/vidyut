'use client';

import { useState, useMemo } from 'react';
import { useAppStore } from '@/stores/app-store';
import { cn, timeAgo } from '@/lib/utils';
import { ClipboardCheck, User, Search, MapPin, Clock, CheckCircle, AlertTriangle, Eye } from 'lucide-react';
import { INSPECTION_OUTCOMES } from '@/lib/constants';
import type { Inspection } from '@/types';

export default function InspectionsPage() {
  const { inspections } = useAppStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selected, setSelected] = useState<Inspection | null>(null);

  const filtered = useMemo(() => {
    return inspections.filter(ins => {
      const nameMatch = ins.consumer_name?.toLowerCase().includes(search.toLowerCase()) ?? false;
      const meterMatch = ins.meter_number?.includes(search) ?? false;
      if (search && !nameMatch && !meterMatch) return false;
      if (statusFilter !== 'all' && ins.status !== statusFilter) return false;
      return true;
    }).sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));
  }, [inspections, search, statusFilter]);

  const statusCounts = {
    pending: inspections.filter(i => i.status === 'pending').length,
    assigned: inspections.filter(i => i.status === 'assigned').length,
    investigating: inspections.filter(i => i.status === 'investigating').length,
    resolved: inspections.filter(i => i.status === 'resolved').length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold font-[family-name:var(--font-outfit)]">Ranked Inspection Queue</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Priority-ranked anomaly inspections with engineer assignments</p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(statusCounts).map(([status, count]) => (
          <button key={status} onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)}
            className={cn('stat-card text-left transition-all', statusFilter === status && 'border-primary/30 glow-sm')}>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{status}</p>
            <p className="text-2xl font-bold font-[family-name:var(--font-outfit)] mt-1">{count}</p>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] flex-1 max-w-sm">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <input type="text" placeholder="Search inspections..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground" />
        </div>
      </div>

      {/* Inspection List */}
      <div className="space-y-3">
        {filtered.map((ins, idx) => (
          <div key={ins.id} className={cn('glass-card rounded-xl p-4 flex items-center gap-4 hover:border-white/[0.1] transition-all cursor-pointer',
            ins.status === 'pending' && ins.priority <= 3 && 'border-red-500/20')}
            onClick={() => setSelected(ins)}>
            {/* Priority Badge */}
            <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0',
              ins.priority <= 3 ? 'bg-red-500/10 text-red-400' : ins.priority <= 7 ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'
            )}>#{ins.priority}</div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold truncate">{ins.consumer_name}</p>
                <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-semibold border',
                  ins.status === 'pending' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                  ins.status === 'assigned' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                  ins.status === 'investigating' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                )}>{ins.status}</span>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                <span>{ins.meter_number}</span>
                <span>·</span>
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{ins.locality}</span>
                <span>·</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{timeAgo(ins.created_at)}</span>
              </div>
            </div>

            {/* Confidence */}
            <div className="text-right flex-shrink-0">
              <p className="text-xs text-muted-foreground">Confidence</p>
              <p className={cn('text-lg font-bold tabular-nums',
                (ins.confidence_score ?? 0) > 0.7 ? 'text-red-400' : (ins.confidence_score ?? 0) > 0.4 ? 'text-amber-400' : 'text-emerald-400'
              )}>{((ins.confidence_score ?? 0) * 100).toFixed(0)}%</p>
            </div>

            {/* Assigned Engineer */}
            {ins.assigned_engineer_name && (
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="text-xs text-muted-foreground hidden md:block">{ins.assigned_engineer_name}</span>
              </div>
            )}

            {/* Outcome */}
            {ins.outcome && (
              <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-semibold border flex-shrink-0',
                ins.outcome === 'confirmed_theft' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                ins.outcome === 'faulty_meter' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                ins.outcome === 'false_positive' ? 'bg-gray-500/10 text-gray-400 border-gray-500/20' :
                'bg-blue-500/10 text-blue-400 border-blue-500/20'
              )}>
                {INSPECTION_OUTCOMES[ins.outcome]?.label}
              </span>
            )}

            <Eye className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </div>
        ))}
      </div>

      {/* Detail Panel */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in" onClick={() => setSelected(null)}>
          <div className="w-full max-w-md glass-card rounded-2xl p-6 m-4 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Inspection #{selected.priority}</h2>
              <button onClick={() => setSelected(null)} className="p-1 hover:bg-white/[0.04] rounded">✕</button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Consumer</span><span className="font-medium">{selected.consumer_name ?? 'Unknown'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Meter</span><span>{selected.meter_number ?? 'N/A'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Locality</span><span>{selected.locality ?? 'N/A'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Confidence</span><span className="font-bold text-primary">{((selected.confidence_score ?? 0) * 100).toFixed(1)}%</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className="capitalize">{selected.status}</span></div>
              {selected.assigned_engineer_name && <div className="flex justify-between"><span className="text-muted-foreground">Engineer</span><span>{selected.assigned_engineer_name}</span></div>}
              {selected.outcome && <div className="flex justify-between"><span className="text-muted-foreground">Outcome</span><span>{INSPECTION_OUTCOMES[selected.outcome]?.label}</span></div>}
              {selected.notes && <div className="pt-2 border-t border-white/[0.06]"><p className="text-muted-foreground text-xs mb-1">Notes</p><p className="text-xs">{selected.notes}</p></div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
