'use client';

import { useRef, useState, useMemo } from 'react';
import { useAppStore } from '@/stores/app-store';
import { cn, formatNumber } from '@/lib/utils';
import jsPDF from 'jspdf';
import { toJpeg } from 'html-to-image';
import { 
  Briefcase, Download, TrendingUp, ShieldCheck, 
  Zap, FileText, Bot, AlertTriangle, TrendingDown, RefreshCw
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';

const REVENUE_DATA = Array.from({ length: 6 }).map((_, i) => ({
  month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'][i],
  leakage: 12.5 - i * 0.8 + (Math.random() * 2), // Millions
  recovered: 2.1 + i * 1.2 + (Math.random() * 0.5)
}));

export default function ExecutiveDashboardPage() {
  const { stats } = useAppStore();
  const [exporting, setExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const handleExport = async () => {
    if (!reportRef.current) return;
    setExporting(true);
    
    try {
      // Longer delay for chart stabilization
      await new Promise(resolve => setTimeout(resolve, 1000));

      const dataUrl = await toJpeg(reportRef.current, {
        quality: 0.98,
        backgroundColor: '#050a14',
        pixelRatio: 2,
        // Filter out buttons and UI elements from the PDF
        filter: (node: any) => {
          return node?.tagName !== 'BUTTON' && !node?.classList?.contains('export-hide');
        }
      });
      
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      pdf.addImage(dataUrl, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`VIDYUT_Executive_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('PDF Export Error:', error);
      alert('High-fidelity export failed. Using browser print...');
      window.print();
    } finally {
      setExporting(false);
    }
  };

  const strategicBriefing = useMemo(() => {
    if (!stats) return null;
    
    const recoveryRate = 87; // Base target
    const gridHealth = stats.grid_health_score.toFixed(1);
    const accuracy = 94.2;
    const leakageChange = -8.4;
    
    return {
      financial: `AI-driven targeting has maintained a ${recoveryRate}% recovery efficiency. Cumulative grid intelligence indicates a ${Math.abs(leakageChange)}% YoY reduction in revenue leakage through prioritized field interventions.`,
      vulnerability: `Statewide Grid Reliability is holding at ${gridHealth}%. Predictive models suggest prioritizing transformer maintenance in high-load sectors to prevent potential outages during peak demand periods.`,
      efficiency: `Current AI Pipeline is operating at ${accuracy}% accuracy. Automated triage has optimized field engineer dispatching, targeting ${stats.inspections_pending || 12} pending high-confidence anomalies this quarter.`
    };
  }, [stats]);

  if (!stats) return null;

  return (
    <div ref={reportRef} className="space-y-6 animate-fade-in pb-10 bg-[#050a14] p-8 rounded-xl min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-4xl font-bold font-[family-name:var(--font-outfit)] tracking-tight">Executive Intelligence</h1>
          <p className="text-sm text-muted-foreground mt-1">C-Level Strategic Overview &amp; Revenue Protection Metrics</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-emerald-500 text-emerald-950 font-bold hover:bg-emerald-400 transition-colors disabled:opacity-50 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
          >
            {exporting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            <span className="text-sm uppercase tracking-wider">{exporting ? 'Generating...' : 'Export Board Report'}</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Row */}
      <div className="grid grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-6 border-t-2 border-t-red-500">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-red-500/10 rounded-lg"><TrendingDown className="h-5 w-5 text-red-500" /></div>
            <span className="text-xs font-bold text-red-400 bg-red-500/10 px-2 py-1 rounded">-8.4% YoY</span>
          </div>
          <h3 className="text-3xl font-mono font-bold">₹42.8<span className="text-xl text-muted-foreground">Cr</span></h3>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mt-2">Est. Revenue Leakage</p>
        </div>
        
        <div className="glass-card rounded-xl p-6 border-t-2 border-t-emerald-500 bg-emerald-500/5">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-emerald-500/10 rounded-lg"><ShieldCheck className="h-5 w-5 text-emerald-500" /></div>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">+314% YoY</span>
          </div>
          <h3 className="text-3xl font-mono font-bold text-emerald-400">₹18.5<span className="text-xl opacity-70">Cr</span></h3>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mt-2">Recovered Revenue (AI Driven)</p>
        </div>

        <div className="glass-card rounded-xl p-6 border-t-2 border-t-primary">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-primary/10 rounded-lg"><Zap className="h-5 w-5 text-primary" /></div>
            <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded">24 Outages Prevented</span>
          </div>
          <h3 className="text-3xl font-mono font-bold">{stats.grid_health_score}%</h3>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mt-2">Statewide Grid Reliability</p>
        </div>

        <div className="glass-card rounded-xl p-6 border-t-2 border-t-purple-500">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-purple-500/10 rounded-lg"><Bot className="h-5 w-5 text-purple-400" /></div>
            <span className="text-xs font-bold text-purple-400 bg-purple-500/10 px-2 py-1 rounded">94.2% Accuracy</span>
          </div>
          <h3 className="text-3xl font-mono font-bold">87%</h3>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mt-2">Field Inspection Success Rate</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 glass-card rounded-xl p-6">
          <h3 className="font-bold uppercase tracking-wider text-sm mb-6">Revenue Protection Impact (Cr)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={REVENUE_DATA}>
              <defs>
                <linearGradient id="leakGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="recovGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#6b7a8d' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#6b7a8d' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'rgba(10,14,26,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
              <Area type="monotone" name="Leakage" dataKey="leakage" stroke="#ef4444" strokeWidth={2} fill="url(#leakGrad)" />
              <Area type="monotone" name="Recovered" dataKey="recovered" stroke="#22c55e" strokeWidth={2} fill="url(#recovGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* AI Auto-Generated Report */}
        <div className="glass-card rounded-xl p-6 border border-primary/20 bg-primary/5 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Bot className="h-5 w-5 text-primary" />
            <h3 className="font-bold uppercase tracking-wider text-sm text-primary">LLM Strategic Briefing</h3>
          </div>
          
          <div className="flex-1 space-y-4 text-sm text-foreground/90 leading-relaxed">
            {strategicBriefing && (
              <>
                <p className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
                  <strong className="text-emerald-400">Financial Impact:</strong> {strategicBriefing.financial}
                </p>
                <p className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
                  <strong className="text-amber-400">Grid Vulnerability:</strong> {strategicBriefing.vulnerability}
                </p>
                <p className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
                  <strong className="text-primary">Operational Efficiency:</strong> {strategicBriefing.efficiency}
                </p>
              </>
            )}
          </div>
          
          <button 
            onClick={handleExport}
            disabled={exporting}
            className="mt-4 w-full py-2 bg-black/40 hover:bg-black/60 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {exporting ? <RefreshCw className="h-3 w-3 animate-spin" /> : <FileText className="h-3 w-3" />}
            {exporting ? 'Generating...' : 'Generate Full Report'}
          </button>
        </div>
      </div>
    </div>
  );
}
