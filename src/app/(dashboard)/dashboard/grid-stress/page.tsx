'use client';

import { useState, useEffect } from 'react';
import { fetchGridStress } from '@/services/supabase-services';
import { cn } from '@/lib/utils';
import { Zap, AlertTriangle, Clock, Shield, TrendingUp, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import type { GridStress } from '@/types';

export default function GridStressPage() {
  const [stressData, setStressData] = useState<GridStress[]>([]);

  useEffect(() => {
    fetchGridStress().then(setStressData);
  }, []);

  const critical = stressData.filter(s => s.risk_level === 'red');
  const warning = stressData.filter(s => s.risk_level === 'amber');

  const chartData = stressData.map(s => ({
    name: s.feeder_name.replace('Feeder ', ''),
    current: +(s.current_utilization * 100).toFixed(1),
    predicted: +(s.predicted_peak_utilization * 100).toFixed(1),
    risk: s.risk_level,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold font-[family-name:var(--font-outfit)]">Grid Stress Prediction</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Transformer & feeder utilization risk analysis</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <Zap className="h-4 w-4 text-primary mb-2" />
          <p className="text-2xl font-bold font-[family-name:var(--font-outfit)]">{stressData.length}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Feeders Monitored</p>
        </div>
        <div className="stat-card">
          <AlertTriangle className="h-4 w-4 text-red-400 mb-2" />
          <p className="text-2xl font-bold text-red-400 font-[family-name:var(--font-outfit)]">{critical.length}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Critical Overload Risk</p>
        </div>
        <div className="stat-card">
          <Shield className="h-4 w-4 text-amber-400 mb-2" />
          <p className="text-2xl font-bold text-amber-400 font-[family-name:var(--font-outfit)]">{warning.length}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Warning State</p>
        </div>
        <div className="stat-card">
          <Clock className="h-4 w-4 text-purple-400 mb-2" />
          <p className="text-2xl font-bold text-purple-400 font-[family-name:var(--font-outfit)]">{critical.filter(c => c.predicted_overload_time).length}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Predicted Overloads</p>
        </div>
      </div>

      {/* Utilization Chart */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-semibold">Feeder Utilization: Current vs Predicted Peak</h3>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" /> Current</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-400" /> Predicted Peak</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6b7a8d' }} />
            <YAxis tick={{ fontSize: 10, fill: '#6b7a8d' }} domain={[0, 100]} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: 'hsl(222,47%,8%)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px' }} />
            <Bar dataKey="current" radius={[4, 4, 0, 0]} maxBarSize={20}>
              {chartData.map((d, i) => (
                <Cell key={i} fill={d.risk === 'red' ? '#ef4444' : d.risk === 'amber' ? '#f59e0b' : '#00e5ff'} fillOpacity={0.7} />
              ))}
            </Bar>
            <Bar dataKey="predicted" radius={[4, 4, 0, 0]} maxBarSize={20} fillOpacity={0.4}>
              {chartData.map((d, i) => (
                <Cell key={i} fill={d.risk === 'red' ? '#ef4444' : d.risk === 'amber' ? '#f59e0b' : '#00e5ff'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Feeder Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stressData.sort((a, b) => b.current_utilization - a.current_utilization).map((s) => (
          <div key={s.feeder_id} className={cn('glass-card rounded-xl p-5 transition-all', s.risk_level === 'red' && 'border-red-500/20')}>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold">{s.feeder_name}</h4>
              <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold border',
                s.risk_level === 'red' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                s.risk_level === 'amber' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              )}>{s.risk_level.toUpperCase()}</span>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Current Load</span>
                  <span className="font-semibold">{(s.current_utilization * 100).toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{
                    width: `${s.current_utilization * 100}%`,
                    background: s.risk_level === 'red' ? '#ef4444' : s.risk_level === 'amber' ? '#f59e0b' : '#22c55e',
                  }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Predicted Peak</span>
                  <span className="font-semibold">{(s.predicted_peak_utilization * 100).toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700 opacity-60" style={{
                    width: `${s.predicted_peak_utilization * 100}%`,
                    background: s.predicted_peak_utilization > 0.85 ? '#ef4444' : '#f59e0b',
                  }} />
                </div>
              </div>

              {s.predicted_overload_time && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/5 border border-red-500/10 mt-2">
                  <Clock className="h-3.5 w-3.5 text-red-400" />
                  <span className="text-[11px] text-red-400">Overload predicted at {new Date(s.predicted_overload_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              )}

              <div className="pt-2 border-t border-white/[0.04]">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Recommendations</p>
                {s.recommendations.map((r, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <ArrowRight className="h-2.5 w-2.5 text-primary" />
                    <span>{r}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
