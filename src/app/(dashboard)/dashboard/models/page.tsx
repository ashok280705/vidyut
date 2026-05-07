'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { 
  Cpu, GitBranch, RefreshCw, AlertTriangle, CheckCircle2, 
  BarChart3, Activity, Clock, ShieldCheck, Download
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

// Mock drift data
const driftData = Array.from({ length: 30 }).map((_, i) => ({
  day: i,
  lightgbm: 0.05 + Math.random() * 0.02 + (i > 20 ? (i - 20) * 0.015 : 0),
  isoforest: 0.02 + Math.random() * 0.01
}));

const MODELS = [
  {
    id: 'lgbm-demand',
    name: 'LightGBM Demand Forecaster',
    type: 'Quantile Regression',
    status: 'deployed',
    version: 'v2.4.1',
    lastTrained: '2026-05-01T03:00:00Z',
    accuracy: 94.2,
    drift: 0.18,
    latency: 45,
    description: 'Predicts p10, p50, p90 bounds for smart meter energy consumption.'
  },
  {
    id: 'iso-theft',
    name: 'Isolation Forest Anomaly',
    type: 'Unsupervised Detection',
    status: 'deployed',
    version: 'v1.8.0',
    lastTrained: '2026-04-15T02:00:00Z',
    accuracy: 88.5,
    drift: 0.03,
    latency: 120,
    description: 'Detects zero-drops, structural deviations, and cluster outliers.'
  },
  {
    id: 'peer-dev',
    name: 'Peer Deviation Engine',
    type: 'Statistical Rule System',
    status: 'deployed',
    version: 'v3.0.2',
    lastTrained: 'N/A (Ruleset)',
    accuracy: 91.0,
    drift: 0.01,
    latency: 15,
    description: 'Z-score based thresholding against localized peer groups.'
  }
];

export default function ModelManagementPage() {
  const [activeModel, setActiveModel] = useState(MODELS[0].id);
  const [retraining, setRetraining] = useState(false);
  const [progress, setProgress] = useState(0);

  const selectedModel = MODELS.find(m => m.id === activeModel)!;

  const handleRetrain = () => {
    setRetraining(true);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setRetraining(false), 1000);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 500);
  };

  const handleExportWeights = () => {
    const data = JSON.stringify({
      model: selectedModel.name,
      version: selectedModel.version,
      timestamp: new Date().toISOString(),
      weights: Array.from({ length: 10 }).map(() => Math.random())
    }, null, 2);
    
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedModel.id}_weights_${selectedModel.version}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-[family-name:var(--font-outfit)] tracking-tight">Model Management Center</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Enterprise AI Operations, Drift Monitoring, and Automated Retraining</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleExportWeights}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-black/40 border border-white/[0.06] hover:bg-white/[0.04] transition-colors"
          >
            <Download className="h-4 w-4" /> <span className="text-sm font-medium">Export Weights</span>
          </button>
          <button 
            onClick={handleRetrain}
            disabled={retraining}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn("h-4 w-4", retraining && "animate-spin")} /> 
            <span className="text-sm font-bold uppercase tracking-wider">{retraining ? `Retraining ${Math.round(progress)}%` : 'Force Retraining'}</span>
          </button>
        </div>
      </div>

      {retraining && (
        <div className="h-1 bg-white/[0.04] rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Sidebar Model List */}
        <div className="lg:col-span-4 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground ml-1">Deployed Pipelines</h3>
          {MODELS.map(model => (
            <div 
              key={model.id}
              onClick={() => setActiveModel(model.id)}
              className={cn(
                "p-4 rounded-xl cursor-pointer transition-all border",
                activeModel === model.id 
                  ? "bg-primary/5 border-primary/30 shadow-[0_0_15px_rgba(0,229,255,0.1)]" 
                  : "bg-black/20 border-white/[0.06] hover:bg-white/[0.04]"
              )}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <Cpu className={cn("h-4 w-4", activeModel === model.id ? "text-primary" : "text-muted-foreground")} />
                  <h4 className="font-bold text-sm">{model.name}</h4>
                </div>
                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[9px] font-bold uppercase tracking-wider rounded border border-emerald-500/20">
                  {model.version}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-3 line-clamp-1">{model.type}</p>
              
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="bg-black/40 rounded p-1.5 border border-white/[0.04]">
                  <span className="text-muted-foreground block mb-0.5">Accuracy</span>
                  <span className="font-mono font-bold text-emerald-400">{model.accuracy}%</span>
                </div>
                <div className={cn("bg-black/40 rounded p-1.5 border border-white/[0.04]", model.drift > 0.15 && "border-amber-500/30 bg-amber-500/5")}>
                  <span className="text-muted-foreground block mb-0.5">Drift Score</span>
                  <span className={cn("font-mono font-bold", model.drift > 0.15 ? "text-amber-400" : "text-foreground")}>{model.drift.toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Model View */}
        <div className="lg:col-span-8 space-y-6">
          {/* Top Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="glass-card p-4 rounded-xl">
              <p className="text-[10px] uppercase text-muted-foreground tracking-wider mb-1">Status</p>
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <CheckCircle2 className="h-5 w-5" /> Active
              </div>
            </div>
            <div className="glass-card p-4 rounded-xl">
              <p className="text-[10px] uppercase text-muted-foreground tracking-wider mb-1">Inference Latency</p>
              <div className="flex items-center gap-2 font-mono font-bold text-xl">
                {selectedModel.latency} <span className="text-sm text-muted-foreground">ms</span>
              </div>
            </div>
            <div className="glass-card p-4 rounded-xl">
              <p className="text-[10px] uppercase text-muted-foreground tracking-wider mb-1">Last Trained</p>
              <div className="flex items-center gap-2 font-mono text-sm font-medium">
                {selectedModel.lastTrained !== 'N/A (Ruleset)' ? new Date(selectedModel.lastTrained).toLocaleDateString() : 'Static'}
              </div>
            </div>
            <div className="glass-card p-4 rounded-xl border-amber-500/20 bg-amber-500/5">
              <p className="text-[10px] uppercase text-amber-500/80 tracking-wider mb-1">Recommended Action</p>
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase">
                {selectedModel.drift > 0.15 ? 'Schedule Retrain' : 'Monitor'}
              </div>
            </div>
          </div>

          {/* Drift Chart */}
          <div className="glass-card p-6 rounded-xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold uppercase tracking-wider text-sm">Model Drift Detection</h3>
                <p className="text-xs text-muted-foreground mt-1">Jensen-Shannon Divergence over 30 days</p>
              </div>
              {selectedModel.drift > 0.15 && (
                <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 text-amber-400 text-[10px] font-bold uppercase border border-amber-500/20 rounded-lg">
                  <AlertTriangle className="h-3 w-3" /> Drift Threshold Exceeded
                </div>
              )}
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={driftData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#6b7a8d' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#6b7a8d' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ background: 'rgba(10,14,26,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey={selectedModel.id === 'lgbm-demand' ? 'lightgbm' : 'isoforest'} 
                  stroke={selectedModel.drift > 0.15 ? '#f59e0b' : '#00e5ff'} 
                  strokeWidth={2} 
                  dot={false} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Retraining History / Rollback */}
          <div className="glass-card p-6 rounded-xl">
            <h3 className="font-bold uppercase tracking-wider text-sm mb-4">Pipeline Registry & Rollbacks</h3>
            <div className="divide-y divide-white/[0.06]">
              {[
                { version: 'v2.4.1', date: '2026-05-01', acc: '94.2%', size: '145MB', status: 'Active' },
                { version: 'v2.4.0', date: '2026-04-15', acc: '93.8%', size: '142MB', status: 'Archived' },
                { version: 'v2.3.5', date: '2026-03-01', acc: '91.2%', size: '138MB', status: 'Archived' },
              ].map((v, i) => (
                <div key={v.version} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-white/[0.04] p-2 rounded-lg">
                      <GitBranch className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold flex items-center gap-2">
                        {v.version}
                        {i === 0 && <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded uppercase">Deployed</span>}
                      </h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Trained on {v.date} • {v.size}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-[10px] text-muted-foreground uppercase">Accuracy</p>
                      <p className="text-sm font-mono font-bold text-emerald-400">{v.acc}</p>
                    </div>
                    {i !== 0 ? (
                      <button className="px-3 py-1.5 text-xs font-bold uppercase bg-white/[0.04] hover:bg-white/[0.1] rounded border border-white/[0.06] transition-colors">
                        Rollback
                      </button>
                    ) : (
                      <button className="px-3 py-1.5 text-xs font-bold uppercase bg-black/40 text-muted-foreground rounded border border-transparent cursor-not-allowed">
                        Current
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
