'use client';

import { useState, useEffect } from 'react';
import { fetchForecasts, fetchDemandHistory } from '@/services/supabase-services';
import { cn } from '@/lib/utils';
import { TrendingUp, Calendar, Cpu, BarChart3, ArrowUpRight, ArrowDownRight, Layers } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, ReferenceLine } from 'recharts';
import type { Forecast } from '@/types';

export default function ForecastingPage() {
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [demandHistory, setDemandHistory] = useState<{ timestamp: string; demand: number; forecast: number }[]>([]);
  const [horizon, setHorizon] = useState<'24h' | '48h' | '7d'>('24h');

  useEffect(() => {
    const hours = horizon === '24h' ? 24 : horizon === '48h' ? 48 : 168;
    fetchForecasts(hours).then(setForecasts);
    fetchDemandHistory(7).then(setDemandHistory);
  }, [horizon]);

  const chartData = forecasts.map(f => ({
    time: new Date(f.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    predicted: f.predicted_kwh,
    upper: f.upper_bound,
    lower: f.lower_bound,
    risk: f.risk_level,
  }));

  const peakForecast = forecasts.reduce((max, f) => f.predicted_kwh > max.predicted_kwh ? f : max, forecasts[0]);
  const avgConfidence = forecasts.length ? forecasts.reduce((s, f) => s + f.confidence, 0) / forecasts.length : 0;
  const redCount = forecasts.filter(f => f.risk_level === 'red').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-outfit)]">AI Demand Forecasting</h1>
          <p className="text-sm text-muted-foreground mt-0.5">LightGBM quantile regression with uncertainty bounds</p>
        </div>
        <div className="flex items-center gap-1 bg-white/[0.04] rounded-lg p-1 border border-white/[0.06]">
          {(['24h', '48h', '7d'] as const).map(h => (
            <button key={h} onClick={() => setHorizon(h)}
              className={cn('px-3 py-1.5 rounded-md text-xs font-medium transition-all', horizon === h ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground')}>
              {h}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2"><TrendingUp className="h-4 w-4 text-primary" /></div>
          <p className="text-2xl font-bold font-[family-name:var(--font-outfit)]">{peakForecast?.predicted_kwh.toFixed(0)} <span className="text-sm text-muted-foreground">MW</span></p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Peak Predicted</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2"><Cpu className="h-4 w-4 text-emerald-400" /></div>
          <p className="text-2xl font-bold font-[family-name:var(--font-outfit)] text-emerald-400">{(avgConfidence * 100).toFixed(1)}%</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Avg Confidence</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2"><BarChart3 className="h-4 w-4 text-amber-400" /></div>
          <p className="text-2xl font-bold font-[family-name:var(--font-outfit)] text-amber-400">{redCount}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">High Risk Periods</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2"><Layers className="h-4 w-4 text-purple-400" /></div>
          <p className="text-2xl font-bold font-[family-name:var(--font-outfit)] text-purple-400">v2.4.1</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Model Version</p>
        </div>
      </div>

      {/* Forecast Chart */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-semibold">Demand Forecast with Uncertainty Bands</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Prediction interval: 90% confidence</p>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" /> Predicted</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-6 rounded bg-primary/20" /> Uncertainty</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00e5ff" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#00e5ff" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="bandGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00e5ff" stopOpacity={0.08} />
                <stop offset="100%" stopColor="#00e5ff" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#6b7a8d' }} interval={Math.floor(chartData.length / 12)} />
            <YAxis tick={{ fontSize: 10, fill: '#6b7a8d' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: 'hsl(222,47%,8%)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px' }} />
            <Area type="monotone" dataKey="upper" stroke="transparent" fill="url(#bandGrad)" />
            <Area type="monotone" dataKey="lower" stroke="transparent" fill="hsl(222,47%,6%)" />
            <Area type="monotone" dataKey="predicted" stroke="#00e5ff" strokeWidth={2} fill="url(#predGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Forecast Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/[0.06]">
          <h3 className="text-sm font-semibold">Hourly Forecast Breakdown</h3>
        </div>
        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-[hsl(222,47%,7%)]">
              <tr className="border-b border-white/[0.06]">
                <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Time</th>
                <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Predicted (MW)</th>
                <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Range</th>
                <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Confidence</th>
                <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Risk</th>
              </tr>
            </thead>
            <tbody>
              {forecasts.slice(0, 24).map((f, i) => (
                <tr key={f.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-2.5 text-xs">{new Date(f.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</td>
                  <td className="px-4 py-2.5 text-xs font-semibold">{f.predicted_kwh.toFixed(1)}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{f.lower_bound.toFixed(1)} – {f.upper_bound.toFixed(1)}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-12 bg-white/[0.04] rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${f.confidence * 100}%` }} />
                      </div>
                      <span className="text-xs">{(f.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-semibold border',
                      f.risk_level === 'red' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                      f.risk_level === 'amber' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    )}>{f.risk_level.toUpperCase()}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
