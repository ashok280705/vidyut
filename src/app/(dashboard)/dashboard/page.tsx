'use client';

import { useEffect, useState, useRef } from 'react';
import { useAppStore } from '@/stores/app-store';
import { cn, formatNumber, getRiskBg, timeAgo } from '@/lib/utils';
import { fetchDemandHistory, fetchAnomalies } from '@/services/supabase-services';
import {
  Gauge, Zap, AlertTriangle, ShieldAlert, TrendingUp, Activity,
  Power, BarChart3, Users, Target, ArrowUpRight, ArrowDownRight,
  Clock, Cpu, Radio, Shield, MapPin, Eye, Server, RefreshCw
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import type { Anomaly } from '@/types';

function useAnimatedCounter(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  const ref = useRef<number>(0);
  useEffect(() => {
    const start = ref.current;
    const diff = target - start;
    const startTime = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + diff * eased;
      setValue(current);
      if (progress < 1) requestAnimationFrame(tick);
      else ref.current = target;
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return value;
}

function StatCard({ icon: Icon, label, value, suffix, change, changeType, color, highlight = false }: {
  icon: React.ElementType; label: string; value: number; suffix?: string;
  change?: string; changeType?: 'up' | 'down'; color: string; highlight?: boolean;
}) {
  const animated = useAnimatedCounter(value);
  return (
    <div className={cn('stat-card group relative overflow-hidden', highlight && `border-${color}-500/30 bg-${color}-500/5`)}>
      {highlight && <div className={cn('absolute inset-0 bg-gradient-to-br opacity-10 pointer-events-none', `from-${color}-500/20 to-transparent`)} />}
      <div className="flex items-start justify-between mb-3 relative z-10">
        <div className={cn('p-2 rounded-lg', `bg-${color}-500/10`)}>
          <Icon className={cn('h-4 w-4', `text-${color}-400`)} />
        </div>
        {change && (
          <span className={cn('flex items-center gap-0.5 text-[11px] font-bold px-1.5 py-0.5 rounded bg-black/20',
            changeType === 'up' ? 'text-emerald-400' : 'text-red-400')}>
            {changeType === 'up' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {change}
          </span>
        )}
      </div>
      <div className={cn('text-2xl font-bold font-[family-name:var(--font-outfit)] tabular-nums animate-counter relative z-10', highlight && `text-${color}-400`)}>
        {suffix === '%' ? animated.toFixed(1) : formatNumber(Math.round(animated))}
        {suffix && <span className="text-sm text-muted-foreground ml-1">{suffix}</span>}
      </div>
      <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider relative z-10 font-medium">{label}</p>
    </div>
  );
}

function GridHealthGauge({ score }: { score: number }) {
  const radius = 80;
  const circumference = Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score > 90 ? '#22c55e' : score > 75 ? '#f59e0b' : '#ef4444';

  return (
    <div className="glass-card rounded-xl p-6 flex flex-col items-center relative overflow-hidden">
      <div className="absolute top-4 left-4 flex items-center gap-2">
        <Activity className="h-4 w-4 text-primary" />
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Statewide Grid Health</h3>
      </div>
      <div className="mt-8 relative w-44 h-24 overflow-hidden">
        <svg className="w-44 h-44 -mt-1" viewBox="0 0 180 180">
          <path d="M 10 90 A 80 80 0 0 1 170 90" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" strokeLinecap="round" />
          <path d="M 10 90 A 80 80 0 0 1 170 90" fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1.5s ease-in-out', filter: `drop-shadow(0 0 8px ${color}60)` }} />
        </svg>
        <div className="absolute inset-0 flex items-end justify-center pb-1">
          <span className="text-3xl font-bold font-[family-name:var(--font-outfit)]" style={{ color }}>{score.toFixed(1)}</span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-2 font-medium">System Nominal</p>
    </div>
  );
}

export default function OperationCenter() {
  const { stats, activity, feeders } = useAppStore();
  const [demandData, setDemandData] = useState<{ timestamp: string; demand: number; forecast: number }[]>([]);
  const [activeAnomalies, setActiveAnomalies] = useState<Anomaly[]>([]);

  useEffect(() => {
    fetchDemandHistory(2).then(data => setDemandData(data.slice(-48)));
    fetchAnomalies({ limit: 6, status: 'new' }).then(setActiveAnomalies);
  }, []);

  if (!stats) return null;

  const radarData = feeders.slice(0, 6).map(f => ({
    feeder: f.name.replace('Feeder ', ''),
    utilization: Math.round(f.utilization * 100),
    fullMark: 100,
  }));

  return (
    <div className="space-y-4 animate-fade-in pb-10">
      {/* Realtime Operational Ticker */}
      <div className="bg-black/40 border border-white/[0.06] rounded-lg overflow-hidden flex items-center text-[11px] uppercase tracking-widest font-mono">
        <div className="bg-red-500 text-white font-bold px-3 py-1.5 flex items-center gap-2 z-10 shrink-0">
          <Radio className="h-3 w-3 animate-pulse" /> LIVE
        </div>
        <div className="flex-1 overflow-hidden whitespace-nowrap relative flex items-center">
          <div className="animate-ticker inline-block text-muted-foreground">
            <span className="mx-8"><span className="text-emerald-400">SYS_01:</span> All core ML pipelines nominal</span>
            <span className="mx-8"><span className="text-amber-400">WARN_02:</span> Feeder Whitefield approaching 85% capacity</span>
            <span className="mx-8"><span className="text-red-400">ALERT_03:</span> 2 new high-confidence theft anomalies detected in Indiranagar</span>
            <span className="mx-8"><span className="text-primary">INFO_04:</span> Model retraining scheduled for 03:00 AM</span>
          </div>
        </div>
      </div>

      {/* Statewide Risk Banner */}
      {stats.grid_health_score < 90 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-4">
          <div className="bg-amber-500/20 p-2 rounded-full mt-0.5"><AlertTriangle className="h-5 w-5 text-amber-500" /></div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-amber-500 font-[family-name:var(--font-outfit)]">Elevated Statewide Grid Risk</h3>
            <p className="text-xs text-amber-500/80 mt-1 max-w-3xl">System health is currently degraded ({stats.grid_health_score}%). Weather patterns indicate a potential heatwave driving unforecasted demand spikes across the East Zone. Deploy rapid inspection teams to high-risk anomaly sites.</p>
          </div>
          <button className="px-4 py-2 bg-amber-500 text-amber-950 text-xs font-bold rounded-lg uppercase tracking-wider hover:bg-amber-400 transition-colors">Acknowledge</button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-3xl font-bold font-[family-name:var(--font-outfit)] tracking-tight">Enterprise Command Center</h1>
          <p className="text-sm text-muted-foreground mt-0.5">National-Scale Intelligence &amp; Autonomous Operation</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-black/40 border border-white/[0.06]">
            <Server className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[11px] font-mono text-muted-foreground">WS_CONNECTED</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-xs font-bold tracking-wider text-emerald-400 uppercase">System Active</span>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard icon={Zap} label="State Demand" value={stats.current_demand_mw} suffix="MW" color="cyan" change="+4.2%" changeType="up" highlight />
        <StatCard icon={AlertTriangle} label="Critical Overloads" value={feeders.filter(f => f.status==='critical').length} color="red" change="+1" changeType="up" highlight />
        <StatCard icon={ShieldAlert} label="Unresolved Theft" value={stats.active_anomalies} color="amber" change="-3" changeType="down" />
        <StatCard icon={Target} label="Field Ops Pending" value={stats.inspections_pending} color="purple" />
        <StatCard icon={Power} label="Active Feeders" value={stats.active_feeders} color="emerald" />
        <StatCard icon={Gauge} label="Meters Monitored" value={stats.total_meters} color="blue" />
      </div>

      <div className="grid lg:grid-cols-12 gap-4">
        {/* Main Chart: Demand & Forecast Envelope */}
        <div className="lg:col-span-8 glass-card rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider">Demand Telemetry &amp; AI Forecast Envelope</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Real-time aggregate consumption vs LightGBM p50 predictions</p>
            </div>
            <div className="flex items-center gap-4 text-[11px] font-medium bg-black/20 px-3 py-1.5 rounded-lg border border-white/[0.04]">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(0,229,255,0.8)]" /> Actual Load</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-400" /> AI Forecast</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={demandData}>
              <defs>
                <linearGradient id="demandGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00e5ff" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#00e5ff" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
              <XAxis dataKey="timestamp" tick={{ fontSize: 10, fill: '#6b7a8d' }}
                tickFormatter={(v) => new Date(v).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} interval={4} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#6b7a8d' }} axisLine={false} tickLine={false} dx={-10} />
              <RechartsTooltip contentStyle={{ background: 'rgba(10,14,26,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px', backdropFilter: 'blur(8px)' }}
                labelFormatter={(v) => new Date(v).toLocaleString('en-IN')} />
              <Area type="monotone" dataKey="demand" stroke="#00e5ff" strokeWidth={2.5} fill="url(#demandGrad)" activeDot={{ r: 6, fill: '#00e5ff', strokeWidth: 0, style: { filter: 'drop-shadow(0 0 10px #00e5ff)' } }} />
              <Area type="monotone" dataKey="forecast" stroke="#22c55e" strokeWidth={1.5} fill="url(#forecastGrad)" strokeDasharray="4 4" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Right Stack: Grid Health & AI Monitor */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <GridHealthGauge score={stats.grid_health_score} />
          
          <div className="glass-card rounded-xl p-6 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-purple-400" />
                <h3 className="text-xs uppercase tracking-widest text-muted-foreground font-bold">AI Pipeline Status</h3>
              </div>
              <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 text-[10px] font-bold border border-purple-500/20">v2.4.1</span>
            </div>
            
            <div className="space-y-5 flex-1 justify-center flex flex-col">
              <div>
                <div className="flex justify-between text-[11px] mb-1.5 uppercase font-medium">
                  <span className="text-muted-foreground">Anomaly Confidence Avg</span>
                  <span className="text-primary">{stats.ai_confidence.toFixed(1)}%</span>
                </div>
                <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(0,229,255,0.5)]"
                    style={{ width: `${stats.ai_confidence}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[11px] mb-1.5 uppercase font-medium">
                  <span className="text-muted-foreground">Forecast Accuracy (MAPE)</span>
                  <span className="text-emerald-400">{stats.daily_forecast_accuracy.toFixed(1)}%</span>
                </div>
                <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(34,197,94,0.5)]"
                    style={{ width: `${stats.daily_forecast_accuracy}%` }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="bg-black/20 rounded p-2 border border-white/[0.04]">
                  <p className="text-[9px] text-muted-foreground uppercase">SHAP Explainer</p>
                  <p className="text-xs text-emerald-400 font-bold mt-0.5">ONLINE</p>
                </div>
                <div className="bg-black/20 rounded p-2 border border-white/[0.04]">
                  <p className="text-[9px] text-muted-foreground uppercase">Iso-Forest</p>
                  <p className="text-xs text-emerald-400 font-bold mt-0.5">SYNCED</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-4">
        {/* Active Anomaly Stream */}
        <div className="lg:col-span-5 glass-card rounded-xl p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider">Live Anomaly Stream</h3>
            <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 text-[10px] font-bold border border-red-500/20 animate-pulse">
              {activeAnomalies.length} ACTIVE
            </span>
          </div>
          <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar max-h-[320px]">
            {activeAnomalies.map(a => (
              <div key={a.id} className="p-3 rounded-lg bg-black/20 border border-white/[0.04] hover:bg-white/[0.02] transition-colors cursor-pointer group">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={cn('h-2 w-2 rounded-full', a.risk_level === 'red' ? 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]' : 'bg-amber-500')} />
                    <span className="text-xs font-bold text-foreground">{a.consumer_name || 'Unknown'}</span>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground">{timeAgo(a.detected_at)}</span>
                </div>
                <div className="flex items-center gap-4 text-[11px] mb-2">
                  <span className="text-muted-foreground font-mono">{a.meter_number || 'N/A'}</span>
                  <span className="flex items-center gap-1 text-primary"><Shield className="h-3 w-3" /> {(a.confidence_score * 100).toFixed(0)}% Conf.</span>
                </div>
                <p className="text-[11px] text-muted-foreground line-clamp-1">{a.description}</p>
                <div className="mt-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="text-[10px] font-bold uppercase bg-white/[0.06] hover:bg-white/[0.1] px-2 py-1 rounded text-primary">Investigate</button>
                  <button className="text-[10px] font-bold uppercase bg-white/[0.06] hover:bg-white/[0.1] px-2 py-1 rounded">Dispatch</button>
                </div>
              </div>
            ))}
            {activeAnomalies.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
                <Shield className="h-8 w-8 mb-3 opacity-20" />
                <p className="text-xs">No active anomalies detected in stream.</p>
              </div>
            )}
          </div>
        </div>

        {/* Feeder Overload Radar */}
        <div className="lg:col-span-4 glass-card rounded-xl p-6">
          <h3 className="text-sm font-bold uppercase tracking-wider mb-4">Feeder Stress Radar</h3>
          <div className="flex items-center justify-center h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.06)" />
                <PolarAngleAxis dataKey="feeder" tick={{ fill: '#6b7a8d', fontSize: 10 }} />
                <Radar name="Utilization" dataKey="utilization" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} />
                <RechartsTooltip contentStyle={{ background: 'rgba(10,14,26,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* System & Event Timeline */}
        <div className="lg:col-span-3 glass-card rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider">Event Timeline</h3>
            <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <div className="space-y-4 max-h-[280px] overflow-y-auto pr-2 custom-scrollbar relative">
            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-white/[0.06]" />
            {activity.slice(0, 6).map((item, i) => (
              <div key={item.id} className="relative flex items-start gap-4">
                <span className={cn('relative z-10 mt-1 h-3.5 w-3.5 rounded-full flex items-center justify-center bg-[hsl(222,47%,7%)] border-2',
                  item.severity === 'critical' ? 'border-red-500' :
                  item.severity === 'warning' ? 'border-amber-500' : 'border-primary'
                )} />
                <div className="flex-1 min-w-0 pb-2">
                  <div className="flex justify-between items-start mb-0.5">
                    <p className="text-xs font-bold text-foreground leading-tight">{item.title}</p>
                    <span className="text-[9px] font-mono text-muted-foreground whitespace-nowrap ml-2">{timeAgo(item.timestamp)}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-snug truncate">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
