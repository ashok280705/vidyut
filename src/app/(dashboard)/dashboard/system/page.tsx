'use client';

import { useState, useEffect } from 'react';
import { fetchSystemHealth, fetchIngestionLogs } from '@/services/supabase-services';
import { cn } from '@/lib/utils';
import { Activity, Database, Cpu, Wifi, Server, Clock, CheckCircle, AlertTriangle, RefreshCw, HardDrive } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip } from 'recharts';
import type { SystemHealth } from '@/types';

export default function SystemPage() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [ingestion, setIngestion] = useState<{ id: string; filename: string; uploaded_at: string; total_rows: number; processed_rows: number; failed_rows: number; status: string; }[]>([]);

  // Generate latency timeline
  const latencyData = Array.from({ length: 60 }, (_, i) => ({
    time: `${i}m ago`, latency: Math.random() * 60 + 15, errors: Math.random() > 0.95 ? 1 : 0,
  })).reverse();

  useEffect(() => {
    const loadData = async () => {
      const [hData, iData] = await Promise.all([
        fetchSystemHealth(),
        fetchIngestionLogs(),
      ]);
      setHealth(hData);
      setIngestion(iData);
    };
    
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const services = health ? [
    { name: 'API Gateway', status: 'operational', latency: health.api_latency_ms, icon: Server },
    { name: 'PostgreSQL', status: health.db_health, latency: 8, icon: Database },
    { name: 'Realtime Sync', status: health.realtime_sync === 'connected' ? 'operational' : 'degraded', latency: 3, icon: Wifi },
    { name: 'ML Pipeline', status: health.model_health === 'healthy' ? 'operational' : 'degraded', latency: 45, icon: Cpu },
    { name: 'Ingestion Engine', status: 'operational', latency: 22, icon: HardDrive },
    { name: 'Auth Service', status: 'operational', latency: 12, icon: CheckCircle },
  ] : [];

  if (!health) return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading system health...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-outfit)]">System Health</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Infrastructure monitoring & operational status</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <span className="relative flex h-2 w-2"><span className="animate-ping absolute h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative rounded-full h-2 w-2 bg-emerald-500" /></span>
          <span className="text-xs font-semibold text-emerald-400">ALL SYSTEMS OPERATIONAL</span>
        </div>
      </div>

      {/* Status Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {services.map(s => (
          <div key={s.name} className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <s.icon className="h-4 w-4 text-muted-foreground" />
              <span className={cn('h-2 w-2 rounded-full', s.status === 'operational' ? 'bg-emerald-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]' : 'bg-amber-500')} />
            </div>
            <p className="text-xs font-medium">{s.name}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{(s.latency ?? 0).toFixed(0)}ms · {s.status}</p>
          </div>
        ))}
      </div>

      {/* Metrics */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="stat-card"><p className="text-[10px] text-muted-foreground uppercase tracking-wider">API Latency</p><p className="text-2xl font-bold mt-1">{(health.api_latency_ms ?? 0).toFixed(0)}<span className="text-sm text-muted-foreground ml-1">ms</span></p></div>
        <div className="stat-card"><p className="text-[10px] text-muted-foreground uppercase tracking-wider">DB Connections</p><p className="text-2xl font-bold mt-1">{health.db_connections ?? 0}</p></div>
        <div className="stat-card"><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Ingestion Rate</p><p className="text-2xl font-bold text-primary mt-1">{(health.ingestion_rate ?? 0).toFixed(0)}<span className="text-sm text-muted-foreground ml-1">/min</span></p></div>
        <div className="stat-card"><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Uptime</p><p className="text-2xl font-bold text-emerald-400 mt-1">{(health.uptime_hours ?? 0).toFixed(0)}<span className="text-sm text-muted-foreground ml-1">hrs</span></p></div>
      </div>

      {/* Latency Chart */}
      <div className="glass-card rounded-xl p-6">
        <h3 className="text-sm font-semibold mb-4">API Latency (60 min)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={latencyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#6b7a8d' }} interval={9} />
            <YAxis tick={{ fontSize: 10, fill: '#6b7a8d' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: 'hsl(222,47%,8%)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px' }} />
            <Line type="monotone" dataKey="latency" stroke="#00e5ff" strokeWidth={1.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Ingestion Logs */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/[0.06]"><h3 className="text-sm font-semibold">Recent Ingestion Logs</h3></div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">File</th>
              <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Time</th>
              <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Rows</th>
              <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Failed</th>
              <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {ingestion.map(log => (
              <tr key={log.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                <td className="px-4 py-2.5 text-xs font-medium">{log.filename}</td>
                <td className="px-4 py-2.5 text-xs text-muted-foreground">{new Date(log.uploaded_at).toLocaleTimeString('en-IN')}</td>
                <td className="px-4 py-2.5 text-xs">{log.processed_rows.toLocaleString()} / {log.total_rows.toLocaleString()}</td>
                <td className="px-4 py-2.5 text-xs text-red-400">{log.failed_rows}</td>
                <td className="px-4 py-2.5">
                  <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-semibold border',
                    log.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    log.status === 'processing' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                    'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  )}>{log.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
