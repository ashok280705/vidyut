'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/stores/app-store';
import { cn } from '@/lib/utils';
import { Brain, Zap, Target, ChevronRight, Shield, TrendingDown, BarChart3, FileText, Lightbulb } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, LineChart, Line, Area, AreaChart, ReferenceLine } from 'recharts';
import { ANOMALY_RULES } from '@/lib/constants';
import type { Anomaly } from '@/types';

export default function ExplainabilityPage() {
  const { anomalies } = useAppStore();
  const [selected, setSelected] = useState<Anomaly | null>(null);

  useEffect(() => {
    if (anomalies.length && !selected) setSelected(anomalies.sort((a, b) => b.confidence_score - a.confidence_score)[0]);
  }, [anomalies, selected]);

  if (!selected) return null;

  const expectedKwh = selected.expected_kwh ?? 0;
  const actualKwh = selected.actual_kwh ?? 0;
  const peerAvgKwh = selected.peer_avg_kwh ?? 0;

  const peerData = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}:00`,
    expected: expectedKwh * (0.5 + Math.sin((i - 6) * Math.PI / 12) * 0.5) + Math.random() * 2,
    actual: actualKwh * (0.3 + Math.sin((i - 6) * Math.PI / 12) * 0.4) + Math.random() * 2,
    peer_upper: peerAvgKwh * (0.6 + Math.sin((i - 6) * Math.PI / 12) * 0.5) + 3,
    peer_lower: peerAvgKwh * (0.4 + Math.sin((i - 6) * Math.PI / 12) * 0.5) - 2,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold font-[family-name:var(--font-outfit)]">Explainable AI Panel</h1>
        <p className="text-sm text-muted-foreground mt-0.5">SHAP-based feature explanations and evidence packets</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Anomaly Selector */}
        <div className="lg:col-span-1 glass-card rounded-xl overflow-hidden">
          <div className="p-4 border-b border-white/[0.06]">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Select Anomaly</h3>
          </div>
          <div className="max-h-[600px] overflow-y-auto">
            {[...anomalies].sort((a, b) => (b.confidence_score || 0) - (a.confidence_score || 0)).slice(0, 15).map(a => (
              <button key={a.id} onClick={() => setSelected(a)}
                className={cn('w-full text-left px-4 py-3 border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors flex items-center gap-3',
                  selected?.id === a.id && 'bg-primary/5 border-l-2 border-l-primary')}>
                <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0',
                  a.risk_level === 'red' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'
                )}>{((a.confidence_score || 0) * 100).toFixed(0)}%</div>
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{a.consumer_name || 'Unknown Consumer'}</p>
                  <p className="text-[10px] text-muted-foreground">{a.meter_number || 'No Meter ID'}</p>
                </div>
                <ChevronRight className="h-3 w-3 text-muted-foreground ml-auto flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Explanation Panel */}
        <div className="lg:col-span-3 space-y-6">
          {/* Header */}
          <div className="glass-card rounded-xl p-6 border-primary/20">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-bold font-[family-name:var(--font-outfit)]">AI Evidence Packet</h2>
                </div>
                <p className="text-sm text-muted-foreground">{selected.consumer_name || 'Unknown'} · {selected.meter_number || 'N/A'}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{selected.locality || 'Unknown Locality'} · {selected.feeder_name || 'No Feeder'}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold font-[family-name:var(--font-outfit)] text-primary">{((selected.confidence_score || 0) * 100).toFixed(1)}%</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Confidence</p>
              </div>
            </div>
          </div>

          {/* Plain English Explanation */}
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="h-4 w-4 text-amber-400" />
              <h3 className="text-sm font-semibold">Plain English Explanation</h3>
            </div>
            <div className="bg-amber-500/5 border border-amber-500/10 rounded-lg p-4">
              <p className="text-sm leading-relaxed">
                Meter <span className="font-semibold text-primary">{selected.meter_number || 'N/A'}</span> deviated <span className="font-semibold text-red-400">{(selected.z_score || 0).toFixed(1)}σ</span> below peer expectation and triggered <span className="font-semibold text-amber-400">{(selected.rules_triggered || []).length} rule(s)</span>. Expected consumption was <span className="font-semibold text-emerald-400">{expectedKwh.toFixed(1)} kWh</span> but actual reading was only <span className="font-semibold text-red-400">{actualKwh.toFixed(1)} kWh</span> — a <span className="font-semibold">{(selected.deviation_percent || 0).toFixed(1)}%</span> deviation. Peer group average for this locality and time window was {peerAvgKwh.toFixed(1)} kWh.
              </p>
            </div>
          </div>

          {/* SHAP Chart + Rules */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="glass-card rounded-xl p-6">
              <h3 className="text-sm font-semibold mb-4">SHAP Feature Contributions</h3>
              {selected.shap_features && (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={selected.shap_features} layout="vertical" margin={{ left: 100 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#6b7a8d' }} />
                    <YAxis type="category" dataKey="feature" tick={{ fontSize: 11, fill: '#9ca3af' }} width={100} />
                    <Tooltip contentStyle={{ background: 'hsl(222,47%,8%)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px' }} />
                    <Bar dataKey="contribution" radius={[0, 4, 4, 0]}>
                      {selected.shap_features.map((f, i) => (
                        <Cell key={i} fill={f.direction === 'positive' ? '#ef4444' : '#22c55e'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
              <div className="flex justify-center gap-6 mt-3 text-[11px]">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded bg-red-400" /> Increases risk</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded bg-emerald-400" /> Decreases risk</span>
              </div>
            </div>

            <div className="glass-card rounded-xl p-6">
              <h3 className="text-sm font-semibold mb-4">Triggered Rules</h3>
              <div className="space-y-2">
                {(selected.rules_triggered || []).map((rule, i) => {
                  const ruleInfo = ANOMALY_RULES[rule as keyof typeof ANOMALY_RULES];
                  return (
                    <div key={i} className="flex items-start gap-3 px-3 py-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                      <Shield className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-medium">{ruleInfo?.label || rule}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{ruleInfo?.description || 'AI model detected anomalous pattern'}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Expected vs Actual */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-sm font-semibold mb-4">Expected vs Actual Consumption (24h)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={peerData}>
                <defs>
                  <linearGradient id="peerBand" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.1} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#6b7a8d' }} interval={3} />
                <YAxis tick={{ fontSize: 10, fill: '#6b7a8d' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'hsl(222,47%,8%)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px' }} />
                <Area type="monotone" dataKey="peer_upper" stroke="transparent" fill="url(#peerBand)" />
                <Area type="monotone" dataKey="peer_lower" stroke="transparent" fill="hsl(222,47%,6%)" />
                <Line type="monotone" dataKey="expected" stroke="#22c55e" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="actual" stroke="#ef4444" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-6 mt-3 text-[11px]">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Expected</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-400" /> Actual</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-6 rounded bg-emerald-400/20" /> Peer Band</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
