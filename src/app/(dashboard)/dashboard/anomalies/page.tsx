'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '@/stores/app-store';
import { cn, getRiskBg, timeAgo } from '@/lib/utils';
import { AlertTriangle, Filter, Search, Eye, ChevronDown, Shield, Target, TrendingDown, Zap, Clock, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, PieChart, Pie } from 'recharts';
import { ANOMALY_RULES } from '@/lib/constants';
import { getClient, fetchAnomalies } from '@/services/supabase-services';
import type { Anomaly } from '@/types';

function AnomalyDetailPanel({ anomaly, onClose }: { anomaly: Anomaly; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-lg h-full bg-[hsl(222,47%,7%)] border-l border-white/[0.06] overflow-y-auto animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-white/[0.06] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold font-[family-name:var(--font-outfit)]">Anomaly Details</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{anomaly.meter_number}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/[0.04]">✕</button>
        </div>
        <div className="p-6 space-y-6">
          {/* Consumer Info */}
          <div className="glass-card rounded-xl p-4 space-y-2">
            <p className="text-xs text-muted-foreground">Consumer</p>
            <p className="text-sm font-semibold">{anomaly.consumer_name}</p>
            <p className="text-xs text-muted-foreground">{anomaly.locality} · {anomaly.feeder_name}</p>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="stat-card"><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Confidence</p><p className="text-xl font-bold text-primary mt-1">{(anomaly.confidence_score * 100).toFixed(1)}%</p></div>
            <div className="stat-card"><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Z-Score</p><p className="text-xl font-bold text-amber-400 mt-1">{anomaly.z_score?.toFixed(2) || '0.00'}σ</p></div>
            <div className="stat-card"><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Expected</p><p className="text-xl font-bold text-emerald-400 mt-1">{anomaly.expected_kwh?.toFixed(1) || '0.0'} kWh</p></div>
            <div className="stat-card"><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Actual</p><p className="text-xl font-bold text-red-400 mt-1">{anomaly.actual_kwh?.toFixed(1) || '0.0'} kWh</p></div>
          </div>

          {/* Rules Triggered */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Rules Triggered</h4>
            <div className="space-y-2">
              {(anomaly.rules_triggered || []).map((rule, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/5 border border-red-500/10">
                  <Shield className="h-3.5 w-3.5 text-red-400" />
                  <span className="text-xs">{ANOMALY_RULES[rule as keyof typeof ANOMALY_RULES]?.label || rule}</span>
                </div>
              ))}
            </div>
          </div>

          {/* SHAP Features */}
          {anomaly.shap_features && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">SHAP Feature Contributions</h4>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={anomaly.shap_features} layout="vertical" margin={{ left: 80 }}>
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#6b7a8d' }} />
                  <YAxis type="category" dataKey="feature" tick={{ fontSize: 10, fill: '#6b7a8d' }} width={80} />
                  <Tooltip contentStyle={{ background: 'hsl(222,47%,8%)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px' }} />
                  <Bar dataKey="contribution" radius={[0, 4, 4, 0]}>
                    {anomaly.shap_features.map((f, i) => (
                      <Cell key={i} fill={f.direction === 'positive' ? '#ef4444' : '#22c55e'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* AI Explanation */}
          <div className="glass-card rounded-xl p-4 border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-primary" />
              <h4 className="text-xs font-semibold text-primary">AI Explanation</h4>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{anomaly.description}. Triggered {(anomaly.rules_triggered || []).length} rule(s) with a deviation of {(anomaly.deviation_percent ?? 0).toFixed(1)}% from expected consumption. Peer group average was {(anomaly.peer_avg_kwh ?? 0).toFixed(1)} kWh.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AnomaliesPage() {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedAnomaly, setSelectedAnomaly] = useState<Anomaly | null>(null);

  useEffect(() => {
    loadAnomalies();
  }, [riskFilter, statusFilter]);

  async function loadAnomalies() {
    setLoading(true);
    const data = await fetchAnomalies({ 
      status: statusFilter === 'all' ? undefined : statusFilter,
      risk_level: riskFilter === 'all' ? undefined : riskFilter
    });
    setAnomalies(data);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    return anomalies.filter(a => {
      const cName = a.consumer_name || '';
      const mNum = a.meter_number || '';
      if (search && !cName.toLowerCase().includes(search.toLowerCase()) && !mNum.includes(search)) return false;
      if (riskFilter !== 'all' && a.risk_level !== riskFilter) return false;
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;
      return true;
    }).sort((a, b) => b.confidence_score - a.confidence_score);
  }, [anomalies, search, riskFilter, statusFilter]);

  const riskDist = useMemo(() => [
    { name: 'High Risk', value: anomalies.filter(a => a.risk_level === 'red').length, color: '#ef4444' },
    { name: 'Medium Risk', value: anomalies.filter(a => a.risk_level === 'amber').length, color: '#f59e0b' },
    { name: 'Low Risk', value: anomalies.filter(a => a.risk_level === 'green').length, color: '#22c55e' },
  ], [anomalies]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold font-[family-name:var(--font-outfit)]">Anomaly & Theft Detection</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Multi-model anomaly detection with explainable AI</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Anomalies</p>
          <p className="text-2xl font-bold font-[family-name:var(--font-outfit)] mt-1">{anomalies.length}</p>
        </div>
        <div className="stat-card">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">High Confidence</p>
          <p className="text-2xl font-bold text-red-400 font-[family-name:var(--font-outfit)] mt-1">{anomalies.filter(a => a.confidence_score > 0.7).length}</p>
        </div>
        <div className="stat-card">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Under Investigation</p>
          <p className="text-2xl font-bold text-amber-400 font-[family-name:var(--font-outfit)] mt-1">{anomalies.filter(a => a.status === 'investigating').length}</p>
        </div>
        <div className="stat-card">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Confirmed</p>
          <p className="text-2xl font-bold text-emerald-400 font-[family-name:var(--font-outfit)] mt-1">{anomalies.filter(a => a.status === 'confirmed').length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] flex-1 max-w-xs">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <input type="text" placeholder="Search meters, consumers..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground" />
        </div>
        <select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)}
          className="px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-sm outline-none cursor-pointer">
          <option value="all">All Risk</option>
          <option value="red">High Risk</option>
          <option value="amber">Medium Risk</option>
          <option value="green">Low Risk</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-sm outline-none cursor-pointer">
          <option value="all">All Status</option>
          <option value="new">New</option>
          <option value="investigating">Investigating</option>
          <option value="confirmed">Confirmed</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      {/* Anomaly Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Meter / Consumer</th>
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Type</th>
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Confidence</th>
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Risk</th>
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Status</th>
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Detected</th>
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={() => setSelectedAnomaly(a)}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-xs">{a.consumer_name}</p>
                    <p className="text-[11px] text-muted-foreground">{a.meter_number}</p>
                  </td>
                  <td className="px-4 py-3 text-xs">{ANOMALY_RULES[a.anomaly_type as keyof typeof ANOMALY_RULES]?.label || a.anomaly_type}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 bg-white/[0.04] rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${a.confidence_score * 100}%`, background: a.confidence_score > 0.7 ? '#ef4444' : a.confidence_score > 0.4 ? '#f59e0b' : '#22c55e' }} />
                      </div>
                      <span className="text-xs tabular-nums">{(a.confidence_score * 100).toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-semibold border', getRiskBg(a.risk_level))}>
                      {a.risk_level.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-semibold border',
                      a.status === 'new' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                      a.status === 'investigating' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      a.status === 'confirmed' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                      'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    )}>
                      {a.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{timeAgo(a.detected_at)}</td>
                  <td className="px-4 py-3">
                    <button className="p-1.5 rounded-lg hover:bg-white/[0.04] text-muted-foreground hover:text-primary transition-colors">
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedAnomaly && <AnomalyDetailPanel anomaly={selectedAnomaly} onClose={() => setSelectedAnomaly(null)} />}
    </div>
  );
}
