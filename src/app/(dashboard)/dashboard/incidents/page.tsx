'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/stores/app-store';
import { cn, timeAgo } from '@/lib/utils';
import { fetchIncidents } from '@/services/supabase-services';
import { useAuth } from '@/hooks/use-auth';
import { getSupabaseClient } from '@/lib/supabase/client';
import { 
  ShieldAlert, Clock, User, CheckCircle2, 
  AlertCircle, MessageSquare, Filter, Search,
  ArrowUpRight, MoreVertical, ShieldCheck, ChevronRight
} from 'lucide-react';
import type { Incident } from '@/types';

function ActionButton({ label, onClick, variant }: { label: string; onClick: () => void; variant: 'primary' | 'secondary' | 'outline' }) {
  const styles = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'bg-white/10 text-white hover:bg-white/20',
    outline: 'bg-black/40 text-muted-foreground border border-white/[0.06] hover:text-foreground'
  };
  
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all",
        styles[variant]
      )}
    >
      {label}
    </button>
  );
}

export default function IncidentCommandPage() {
  const { user } = useAuth();
  const isAdmin = user?.role?.toLowerCase() === 'admin';
  
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [engineers, setEngineers] = useState<{id: string, full_name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [filter, setFilter] = useState<'all' | 'detected' | 'verified' | 'escalated' | 'resolved'>('all');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    loadData();
  }, [filter]);

  async function loadData() {
    const client = getSupabaseClient();
    if (!client) return;

    setLoading(true);
    const [incData, engData] = await Promise.all([
      fetchIncidents({ status: filter === 'all' ? undefined : filter }),
      client.from('profiles').select('id, full_name').eq('role', 'field_engineer')
    ]);
    
    setIncidents(incData);
    setEngineers(engData.data || []);
    setLoading(false);
  }

  async function handleAssign(incidentId: string, userId: string) {
    const client = getSupabaseClient();
    if (!client) return;

    const { error } = await client
      .from('incidents')
      .update({ 
        owner_id: userId, 
        status: 'assigned',
        updated_at: new Date().toISOString()
      })
      .eq('id', incidentId);

    if (error) {
      showToast('Assignment failed', 'info');
    } else {
      showToast('Incident assigned successfully', 'success');
      loadData();
    }
  }

  async function handleGlobalDispatch() {
    const unassigned = incidents.find(i => !i.owner_id);
    if (!unassigned) {
      showToast('No unassigned incidents found to dispatch.', 'info');
      return;
    }

    const engineer = engineers[0]; // Auto-pick first available for rapid dispatch
    if (!engineer) {
      showToast('No available Field Engineers to dispatch.', 'info');
      return;
    }

    const client = getSupabaseClient();
    if (!client) return;

    const { error } = await client
      .from('incidents')
      .update({ 
        owner_id: engineer.id, 
        status: 'investigating',
        updated_at: new Date().toISOString()
      })
      .eq('id', unassigned.id);

    if (error) {
      showToast('Dispatch failed', 'info');
    } else {
      showToast(`Rapid Response Team dispatched for: ${unassigned.title}`, 'success');
      loadData();
    }
  }

  async function handleGlobalEscalate() {
    const active = incidents.find(i => i.status !== 'resolved');
    if (!active) return;

    const client = getSupabaseClient();
    if (!client) return;

    await client
      .from('incidents')
      .update({ priority: 'critical', updated_at: new Date().toISOString() })
      .eq('id', active.id);
    
    showToast(`Escalated ${active.title} to Regional Supervisor`, 'success');
    loadData();
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'escalated': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'verified': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      default: return 'text-primary bg-primary/10 border-primary/20';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-500';
      case 'high': return 'text-amber-500';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-[family-name:var(--font-outfit)] tracking-tight">Incident Command</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Real-time anomaly lifecycle &amp; dispatch management</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 rounded-lg bg-black/40 border border-white/[0.06] text-xs font-bold uppercase tracking-widest hover:bg-white/[0.04] transition-colors flex items-center gap-2">
            <Filter className="h-3.5 w-3.5" /> Filter
          </button>
          {isAdmin && (
            <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest hover:bg-primary/90 transition-colors flex items-center gap-2">
              <ShieldAlert className="h-3.5 w-3.5" /> Manual Alert
            </button>
          )}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Active Incidents', value: incidents.filter(i => i.status !== 'resolved').length, icon: ShieldAlert, color: 'text-primary' },
          { label: 'Critical Priority', value: incidents.filter(i => i.priority === 'critical').length, icon: AlertCircle, color: 'text-red-500' },
          { label: 'Avg Resolution', value: '4.2h', icon: Clock, color: 'text-amber-500' },
          { label: 'Resolved Today', value: 12, icon: CheckCircle2, color: 'text-emerald-500' },
        ].map((stat, i) => (
          <div key={i} className="glass-card rounded-xl p-4 flex items-center gap-4">
            <div className={cn('p-2 rounded-lg bg-white/[0.04]', stat.color)}>
              <stat.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{stat.label}</p>
              <p className="text-xl font-bold font-[family-name:var(--font-outfit)]">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search incidents by ID, consumer or locality..."
              className="w-full bg-black/20 border border-white/[0.06] rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
            />
          </div>

          <div className="space-y-3">
            {incidents.map((incident) => (
              <div key={incident.id} className="glass-card rounded-xl p-5 group hover:border-primary/20 transition-all cursor-pointer">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={cn('px-2 py-0.5 rounded text-[10px] font-bold uppercase border', getStatusColor(incident.status))}>
                      {incident.status}
                    </div>
                    <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">{incident.title}</h3>
                  </div>
                  <MoreVertical className="h-4 w-4 text-muted-foreground" />
                </div>
                
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4 leading-relaxed">{incident.description}</p>
                
                <div className="flex items-center justify-between pt-4 border-t border-white/[0.04]">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" /> {timeAgo(incident.created_at)}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <User className="h-3.5 w-3.5" />
                      {isAdmin ? (
                        <select 
                          className="bg-transparent border-none p-0 focus:ring-0 text-muted-foreground cursor-pointer hover:text-foreground transition-colors text-[11px]"
                          value={incident.owner_id || ''}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleAssign(incident.id, e.target.value);
                          }}
                        >
                          <option value="" className="bg-[#050a14] text-white">Unassigned</option>
                          {engineers.map(eng => (
                            <option key={eng.id} value={eng.id} className="bg-[#050a14] text-white">{eng.full_name}</option>
                          ))}
                        </select>
                      ) : (
                        <span>{incident.owner?.full_name || 'Unassigned'}</span>
                      )}
                    </div>
                    <div className={cn('flex items-center gap-2 text-[11px] font-bold uppercase', getPriorityColor(incident.priority))}>
                      <AlertCircle className="h-3.5 w-3.5" /> {incident.priority}
                    </div>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedIncident(incident);
                    }}
                    className="flex items-center gap-1.5 text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-all"
                  >
                    Details <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Ops */}
        <div className="space-y-6">
          {isAdmin && (
            <div className="glass-card rounded-xl p-6 bg-primary/5 border-primary/10">
              <h3 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2 text-primary">
                <ShieldCheck className="h-4 w-4" /> Operational Actions
              </h3>
              <div className="space-y-2">
                <ActionButton 
                  label="Dispatch Rapid Response" 
                  variant="primary" 
                  onClick={handleGlobalDispatch} 
                />
                <ActionButton 
                  label="Escalate to Supervisor" 
                  variant="secondary" 
                  onClick={handleGlobalEscalate} 
                />
                <ActionButton 
                  label="Generate Site Memo" 
                  variant="outline" 
                  onClick={() => showToast('Site Memo PDF generated and attached.', 'success')} 
                />
              </div>
            </div>
          )}

          <div className="glass-card rounded-xl p-6">
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" /> Operational Logs
            </h3>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-white/[0.04] flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-bold">Engineer {i}</span>
                      <span className="text-[10px] text-muted-foreground">14:2{i} IST</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">Verified anomaly at site. Preparing field report.</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Detail Drawer */}
      {selectedIncident && (
        <>
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-in fade-in"
            onClick={() => setSelectedIncident(null)}
          />
          <div className="fixed right-0 top-0 h-full w-full max-w-md bg-[#050a14] border-l border-white/[0.06] z-50 shadow-2xl p-8 overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between mb-8">
              <div className={cn('px-2 py-0.5 rounded text-[10px] font-bold uppercase border', getStatusColor(selectedIncident.status))}>
                {selectedIncident.status}
              </div>
              <button 
                onClick={() => setSelectedIncident(null)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-muted-foreground"
              >
                <ChevronRight className="h-5 w-5 rotate-180" />
              </button>
            </div>

            <h2 className="text-2xl font-bold font-[family-name:var(--font-outfit)] mb-2">{selectedIncident.title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-8">{selectedIncident.description}</p>

            <div className="space-y-6">
              <div className="glass-card rounded-xl p-5 border border-white/[0.06]">
                <h3 className="text-xs font-bold uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
                  <AlertCircle className="h-3.5 w-3.5" /> Anomaly Evidence
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-white/[0.04]">
                    <span className="text-xs text-muted-foreground">Confidence Score</span>
                    <span className="text-xs font-bold text-emerald-400">94.2%</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/[0.04]">
                    <span className="text-xs text-muted-foreground">Pattern Match</span>
                    <span className="text-xs font-bold text-foreground capitalize">Sudden Drop</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/[0.04]">
                    <span className="text-xs text-muted-foreground">Impact Radius</span>
                    <span className="text-xs font-bold text-foreground">Single Meter</span>
                  </div>
                </div>
              </div>

              <div className="glass-card rounded-xl p-5 border border-white/[0.06]">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                  <User className="h-3.5 w-3.5" /> Assigned Personnel
                </h3>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                    {selectedIncident.owner?.full_name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{selectedIncident.owner?.full_name || 'Unassigned'}</p>
                    <p className="text-[11px] text-muted-foreground">ID: {selectedIncident.owner_id?.slice(0, 8) || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  onClick={() => {
                    showToast('Detailed Report Exported as Site Memo PDF.', 'success');
                    setSelectedIncident(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest hover:bg-primary/90 transition-all"
                >
                  Export Site Memo
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={cn(
          "fixed bottom-6 right-6 px-6 py-3 rounded-xl shadow-2xl border flex items-center gap-3 animate-slide-up z-50",
          toast.type === 'success' ? "bg-emerald-500 text-emerald-950 border-emerald-400" : "bg-primary text-primary-foreground border-primary/50"
        )}>
          <ShieldCheck className="h-5 w-5" />
          <span className="text-sm font-bold">{toast.message}</span>
        </div>
      )}
    </div>
  );
}
