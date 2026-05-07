'use client';

import { useState } from 'react';
import { useAppStore } from '@/stores/app-store';
import { cn, timeAgo } from '@/lib/utils';
import { HardHat, MapPin, Camera, Clock, CheckCircle, AlertTriangle, MessageSquare, Navigation } from 'lucide-react';
import { INSPECTION_OUTCOMES } from '@/lib/constants';

export default function FieldOpsPage() {
  const { inspections } = useAppStore();
  const assigned = inspections.filter(i => i.status !== 'resolved' && i.assigned_engineer_name);
  const [activeTab, setActiveTab] = useState<'assigned' | 'completed'>('assigned');
  const displayed = activeTab === 'assigned' ? assigned : inspections.filter(i => i.status === 'resolved');

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold font-[family-name:var(--font-outfit)]">Field Operations</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Engineer inspection assignments and field workflow</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card"><HardHat className="h-4 w-4 text-primary mb-2" /><p className="text-xl font-bold">{assigned.length}</p><p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Active Assignments</p></div>
        <div className="stat-card"><CheckCircle className="h-4 w-4 text-emerald-400 mb-2" /><p className="text-xl font-bold text-emerald-400">{inspections.filter(i => i.status === 'resolved').length}</p><p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Completed Today</p></div>
        <div className="stat-card"><AlertTriangle className="h-4 w-4 text-red-400 mb-2" /><p className="text-xl font-bold text-red-400">{inspections.filter(i => i.outcome === 'confirmed_theft').length}</p><p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Confirmed Thefts</p></div>
        <div className="stat-card"><Navigation className="h-4 w-4 text-amber-400 mb-2" /><p className="text-xl font-bold text-amber-400">{inspections.filter(i => i.status === 'investigating').length}</p><p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">In Progress</p></div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/[0.04] rounded-lg p-1 w-fit border border-white/[0.06]">
        <button onClick={() => setActiveTab('assigned')} className={cn('px-4 py-1.5 rounded-md text-xs font-medium transition-all', activeTab === 'assigned' ? 'bg-primary/20 text-primary' : 'text-muted-foreground')}>Active ({assigned.length})</button>
        <button onClick={() => setActiveTab('completed')} className={cn('px-4 py-1.5 rounded-md text-xs font-medium transition-all', activeTab === 'completed' ? 'bg-primary/20 text-primary' : 'text-muted-foreground')}>Completed ({inspections.filter(i => i.status === 'resolved').length})</button>
      </div>

      {/* Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayed.map(ins => (
          <div key={ins.id} className="glass-card rounded-xl p-5 hover:border-white/[0.1] transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center"><HardHat className="h-4 w-4 text-primary" /></div>
                <div>
                  <p className="text-xs font-semibold">{ins.assigned_engineer_name || 'Unassigned'}</p>
                  <p className="text-[10px] text-muted-foreground">Priority #{ins.priority}</p>
                </div>
              </div>
              <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-semibold border',
                ins.status === 'assigned' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                ins.status === 'investigating' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              )}>{ins.status}</span>
            </div>
            <div className="space-y-2 text-xs">
              <p className="font-medium">{ins.consumer_name || 'Unknown Consumer'}</p>
              <p className="text-muted-foreground">{ins.meter_number || 'No Meter ID'}</p>
              <div className="flex items-center gap-1.5 text-muted-foreground"><MapPin className="h-3 w-3" />{ins.locality || 'Unknown Locality'}</div>
              <div className="flex items-center gap-1.5 text-muted-foreground"><Clock className="h-3 w-3" />{timeAgo(ins.created_at)}</div>
              <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
                <span className="text-muted-foreground">Confidence</span>
                <span className={cn('font-bold', (ins.confidence_score || 0) > 0.7 ? 'text-red-400' : 'text-amber-400')}>{((ins.confidence_score || 0) * 100).toFixed(0)}%</span>
              </div>
              {ins.outcome && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Outcome</span>
                  <span className={cn('px-2 py-0.5 rounded text-[10px] font-semibold',
                    ins.outcome === 'confirmed_theft' ? 'bg-red-500/10 text-red-400' : ins.outcome === 'faulty_meter' ? 'bg-amber-500/10 text-amber-400' : 'bg-gray-500/10 text-gray-400'
                  )}>{INSPECTION_OUTCOMES[ins.outcome]?.label}</span>
                </div>
              )}
            </div>
            {activeTab === 'assigned' && (
              <div className="flex gap-2 mt-4">
                <button className="flex-1 py-2 rounded-lg bg-primary/10 text-primary text-[11px] font-medium hover:bg-primary/20 transition-colors">Log Outcome</button>
                <button className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] transition-colors"><Camera className="h-3.5 w-3.5" /></button>
                <button className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] transition-colors"><MessageSquare className="h-3.5 w-3.5" /></button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
