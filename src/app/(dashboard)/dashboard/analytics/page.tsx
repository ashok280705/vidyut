'use client';

import { useState, useEffect } from 'react';
import { fetchDemandHistory, fetchModelMetrics } from '@/services/supabase-services';
import { cn } from '@/lib/utils';
import { BarChart3, TrendingUp, Shield, Users, Calendar } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, LineChart, Line, PieChart, Pie } from 'recharts';
import { LOCALITIES } from '@/lib/constants';

export default function AnalyticsPage() {
  const [demandData, setDemandData] = useState<{ timestamp: string; demand: number; forecast: number }[]>([]);
  const [models, setModels] = useState<{ model_name: string; version: string; accuracy: number; precision: number; recall: number; f1_score: number; false_positive_rate: number; training_samples: number; last_trained: string; }[]>([]);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('7d');

  useEffect(() => {
    fetchModelMetrics().then(setModels);
  }, []);

  useEffect(() => {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    fetchDemandHistory(days).then(setDemandData);
  }, [period]);

  const localityData = LOCALITIES.slice(0, 10).map(l => ({
    name: l, demand: Math.random() * 50 + 20, anomalies: Math.floor(Math.random() * 8),
    thefts: Math.floor(Math.random() * 3),
  }));

  const monthlyTrend = Array.from({ length: 12 }, (_, i) => ({
    month: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i],
    anomalies: Math.floor(Math.random() * 30 + 10),
    confirmed: Math.floor(Math.random() * 15 + 3),
    false_positive: Math.floor(Math.random() * 10 + 2),
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-outfit)]">Historical Analytics</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Demand history, theft trends, and performance metrics</p>
        </div>
        <div className="flex items-center gap-1 bg-white/[0.04] rounded-lg p-1 border border-white/[0.06]">
          {(['7d', '30d', '90d'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={cn('px-3 py-1.5 rounded-md text-xs font-medium transition-all', period === p ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground')}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Demand History */}
      <div className="glass-card rounded-xl p-6">
        <h3 className="text-sm font-semibold mb-4">Demand History ({period})</h3>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={demandData.filter((_, i) => i % (period === '90d' ? 6 : period === '30d' ? 3 : 1) === 0)}>
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00e5ff" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#00e5ff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="timestamp" tick={{ fontSize: 10, fill: '#6b7a8d' }}
              tickFormatter={v => new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} interval={Math.floor(demandData.length / 10)} />
            <YAxis tick={{ fontSize: 10, fill: '#6b7a8d' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: 'hsl(222,47%,8%)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px' }} />
            <Area type="monotone" dataKey="demand" stroke="#00e5ff" strokeWidth={1.5} fill="url(#areaGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Anomaly Trends */}
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-sm font-semibold mb-4">Monthly Anomaly Trends</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#6b7a8d' }} />
              <YAxis tick={{ fontSize: 10, fill: '#6b7a8d' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'hsl(222,47%,8%)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px' }} />
              <Bar dataKey="anomalies" fill="#00e5ff" radius={[3, 3, 0, 0]} maxBarSize={18} />
              <Bar dataKey="confirmed" fill="#ef4444" radius={[3, 3, 0, 0]} maxBarSize={18} />
              <Bar dataKey="false_positive" fill="#6b7280" radius={[3, 3, 0, 0]} maxBarSize={18} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-3 text-[11px]">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded bg-primary" /> Detected</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded bg-red-400" /> Confirmed</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded bg-gray-500" /> False Positive</span>
          </div>
        </div>

        {/* Locality Comparison */}
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-sm font-semibold mb-4">Locality Comparison</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={localityData} layout="vertical" margin={{ left: 80 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#6b7a8d' }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} width={80} />
              <Tooltip contentStyle={{ background: 'hsl(222,47%,8%)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px' }} />
              <Bar dataKey="demand" fill="#00e5ff" radius={[0, 3, 3, 0]} maxBarSize={14} fillOpacity={0.7} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Model Performance */}
      <div className="glass-card rounded-xl p-6">
        <h3 className="text-sm font-semibold mb-4">AI Model Performance</h3>
        <div className="grid md:grid-cols-3 gap-4">
          {models.map(m => (
            <div key={m.model_name} className="stat-card">
              <p className="text-xs font-semibold mb-3">{m.model_name} <span className="text-muted-foreground font-normal">{m.version}</span></p>
              <div className="grid grid-cols-2 gap-y-2 text-xs">
                <div><span className="text-muted-foreground">Accuracy</span></div><div className="text-right font-semibold text-emerald-400">{(m.accuracy * 100).toFixed(1)}%</div>
                <div><span className="text-muted-foreground">Precision</span></div><div className="text-right font-semibold">{(m.precision * 100).toFixed(1)}%</div>
                <div><span className="text-muted-foreground">Recall</span></div><div className="text-right font-semibold">{(m.recall * 100).toFixed(1)}%</div>
                <div><span className="text-muted-foreground">F1 Score</span></div><div className="text-right font-semibold">{(m.f1_score * 100).toFixed(1)}%</div>
                <div><span className="text-muted-foreground">FP Rate</span></div><div className="text-right font-semibold text-amber-400">{(m.false_positive_rate * 100).toFixed(1)}%</div>
                <div><span className="text-muted-foreground">Samples</span></div><div className="text-right font-semibold">{(m.training_samples / 1000).toFixed(0)}K</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
