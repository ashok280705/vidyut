'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Settings, Users, Zap, MapPin, Shield, Database, Bell, Sliders, FileText } from 'lucide-react';
import { LOCALITIES, FEEDER_NAMES, ANOMALY_RULES } from '@/lib/constants';

const TABS = [
  { id: 'users', label: 'Users', icon: Users },
  { id: 'feeders', label: 'Feeders', icon: Zap },
  { id: 'localities', label: 'Localities', icon: MapPin },
  { id: 'thresholds', label: 'Model Thresholds', icon: Sliders },
  { id: 'audit', label: 'Audit Logs', icon: FileText },
] as const;

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<string>('users');

  const users = [
    { id: 1, name: 'Rajesh Kumar', email: 'rajesh@bescom.gov.in', role: 'admin', status: 'active' },
    { id: 2, name: 'Priya Sharma', email: 'priya@bescom.gov.in', role: 'dispatcher', status: 'active' },
    { id: 3, name: 'Anil Reddy', email: 'anil@bescom.gov.in', role: 'field_engineer', status: 'active' },
    { id: 4, name: 'Kavitha S', email: 'kavitha@bescom.gov.in', role: 'analyst', status: 'active' },
    { id: 5, name: 'Suresh M', email: 'suresh@bescom.gov.in', role: 'field_engineer', status: 'inactive' },
  ];

  const audits = Array.from({ length: 10 }, (_, i) => ({
    id: i, user: ['Rajesh Kumar', 'Priya Sharma', 'System'][i % 3],
    action: ['Updated threshold', 'Assigned inspection', 'Model retrained', 'User role changed', 'Feeder config updated'][i % 5],
    target: ['anomaly_threshold', 'inspection-14', 'LightGBM v2.4', 'user-3', 'feeder-KMG-F01'][i % 5],
    timestamp: new Date(Date.now() - i * 3600000 * 2).toISOString(),
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold font-[family-name:var(--font-outfit)]">Administration</h1>
        <p className="text-sm text-muted-foreground mt-0.5">System configuration, user management, and audit logs</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/[0.04] rounded-lg p-1 w-fit border border-white/[0.06] flex-wrap">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={cn('flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-medium transition-all',
              activeTab === tab.id ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground')}>
            <tab.icon className="h-3.5 w-3.5" />{tab.label}
          </button>
        ))}
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
            <h3 className="text-sm font-semibold">User Management</h3>
            <button className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium border border-primary/20 hover:bg-primary/20 transition-colors">+ Add User</button>
          </div>
          <table className="w-full text-sm">
            <thead><tr className="border-b border-white/[0.06]">
              <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Name</th>
              <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Email</th>
              <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Role</th>
              <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Status</th>
              <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Actions</th>
            </tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-xs font-medium">{u.name}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-[10px] bg-white/[0.04] capitalize">{u.role.replace('_', ' ')}</span></td>
                  <td className="px-4 py-3">
                    <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-semibold border',
                      u.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                    )}>{u.status}</span>
                  </td>
                  <td className="px-4 py-3"><button className="text-xs text-primary hover:underline">Edit</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Feeders Tab */}
      {activeTab === 'feeders' && (
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="p-4 border-b border-white/[0.06]"><h3 className="text-sm font-semibold">Feeder Configuration</h3></div>
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-3 p-4">
            {FEEDER_NAMES.map((name, i) => (
              <div key={name} className="stat-card flex items-center gap-3 cursor-pointer">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center"><Zap className="h-4 w-4 text-primary" /></div>
                <div><p className="text-xs font-medium">{name}</p><p className="text-[10px] text-muted-foreground">{LOCALITIES[i % 20]}</p></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Localities Tab */}
      {activeTab === 'localities' && (
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="p-4 border-b border-white/[0.06]"><h3 className="text-sm font-semibold">Locality Management</h3></div>
          <div className="grid md:grid-cols-4 lg:grid-cols-5 gap-3 p-4">
            {LOCALITIES.map(loc => (
              <div key={loc} className="stat-card flex items-center gap-2 cursor-pointer">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-medium">{loc}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Thresholds Tab */}
      {activeTab === 'thresholds' && (
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-sm font-semibold mb-4">Model & Rule Thresholds</h3>
          <div className="space-y-4">
            {Object.entries(ANOMALY_RULES).map(([key, rule]) => (
              <div key={key} className="flex items-center justify-between py-3 border-b border-white/[0.04]">
                <div>
                  <p className="text-xs font-medium">{rule.label}</p>
                  <p className="text-[11px] text-muted-foreground">{rule.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn('px-2 py-0.5 rounded text-[10px] font-semibold',
                    rule.severity === 'critical' ? 'bg-red-500/10 text-red-400' : rule.severity === 'high' ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-500/10 text-blue-400'
                  )}>{rule.severity}</span>
                  <input type="range" min="0" max="100" defaultValue="70" className="w-24 accent-primary h-1" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Audit Logs Tab */}
      {activeTab === 'audit' && (
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="p-4 border-b border-white/[0.06]"><h3 className="text-sm font-semibold">Audit Log</h3></div>
          <table className="w-full text-sm">
            <thead><tr className="border-b border-white/[0.06]">
              <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Time</th>
              <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">User</th>
              <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Action</th>
              <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Target</th>
            </tr></thead>
            <tbody>
              {audits.map(a => (
                <tr key={a.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{new Date(a.timestamp).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-2.5 text-xs font-medium">{a.user}</td>
                  <td className="px-4 py-2.5 text-xs">{a.action}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground font-mono">{a.target}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
