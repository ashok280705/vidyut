'use client';

import { useState, useEffect, useMemo } from 'react';
import { fetchMeters } from '@/services/supabase-services';
import { cn, getRiskBg } from '@/lib/utils';
import { Gauge, Search, Filter, Upload, Database, ArrowUpDown, Activity } from 'lucide-react';
import type { Meter } from '@/types';

export default function MetersPage() {
  const [meters, setMeters] = useState<Meter[]>([]);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(1);
  const perPage = 25;

  const [total, setTotal] = useState(0);
  useEffect(() => {
    fetchMeters({ page, perPage, risk: riskFilter, type: typeFilter, search }).then(res => {
      setMeters(res.items);
      setTotal(res.total);
    });
  }, [page, perPage, search, riskFilter, typeFilter]);

  const paginated = meters;
  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-outfit)]">Smart Meter Registry</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{total.toLocaleString()} meters across all BESCOM zones</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors border border-primary/20">
          <Upload className="h-4 w-4" /> Upload CSV
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="stat-card"><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total</p><p className="text-xl font-bold mt-1">{meters.length}</p></div>
        <div className="stat-card"><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Active</p><p className="text-xl font-bold text-emerald-400 mt-1">{meters.filter(m => m.status === 'active').length}</p></div>
        <div className="stat-card"><p className="text-[10px] text-muted-foreground uppercase tracking-wider">High Risk</p><p className="text-xl font-bold text-red-400 mt-1">{meters.filter(m => m.risk_level === 'red').length}</p></div>
        <div className="stat-card"><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Tampered</p><p className="text-xl font-bold text-amber-400 mt-1">{meters.filter(m => m.status === 'tampered').length}</p></div>
        <div className="stat-card"><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Faulty</p><p className="text-xl font-bold text-purple-400 mt-1">{meters.filter(m => m.status === 'faulty').length}</p></div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] flex-1 max-w-sm">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <input type="text" placeholder="Search meters, consumers, localities..." value={search} onChange={e => setSearch(e.target.value)}
            className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground" />
        </div>
        <select value={riskFilter} onChange={e => setRiskFilter(e.target.value)} className="px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-sm outline-none">
          <option value="all">All Risk</option><option value="red">High</option><option value="amber">Medium</option><option value="green">Low</option>
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-sm outline-none">
          <option value="all">All Types</option><option value="residential">Residential</option><option value="commercial">Commercial</option><option value="industrial">Industrial</option>
        </select>
        <span className="text-xs text-muted-foreground ml-auto">{total.toLocaleString()} results</span>
      </div>

      {/* Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Meter / Consumer</th>
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Locality</th>
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Type</th>
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Status</th>
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Avg Daily</th>
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Anomaly Score</th>
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Risk</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(m => (
                <tr key={m.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors cursor-pointer">
                  <td className="px-4 py-3"><p className="text-xs font-medium">{m.consumer_name}</p><p className="text-[11px] text-muted-foreground">{m.meter_number}</p></td>
                  <td className="px-4 py-3 text-xs">{m.locality}</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-[10px] bg-white/[0.04] capitalize">{m.meter_type}</span></td>
                  <td className="px-4 py-3">
                    <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-semibold border',
                      m.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      m.status === 'tampered' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                      m.status === 'faulty' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      'bg-gray-500/10 text-gray-400 border-gray-500/20'
                    )}>{m.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs tabular-nums">{m.avg_daily_kwh.toFixed(1)} kWh</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-14 bg-white/[0.04] rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${m.anomaly_score * 100}%`, background: m.anomaly_score > 0.7 ? '#ef4444' : m.anomaly_score > 0.3 ? '#f59e0b' : '#22c55e' }} />
                      </div>
                      <span className="text-[11px] tabular-nums">{(m.anomaly_score * 100).toFixed(0)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3"><span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold border', getRiskBg(m.risk_level))}>{m.risk_level.toUpperCase()}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.06]">
          <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
          <div className="flex gap-1">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-3 py-1 rounded text-xs bg-white/[0.04] disabled:opacity-30 hover:bg-white/[0.08]">Prev</button>
            <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="px-3 py-1 rounded text-xs bg-white/[0.04] disabled:opacity-30 hover:bg-white/[0.08]">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
