'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAppStore } from '@/stores/app-store';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Map, Gauge, TrendingUp, AlertTriangle, Zap,
  ClipboardCheck, Brain, BarChart3, HardHat, Activity, Settings,
  ChevronLeft, ChevronRight, Power, Clock, ShieldAlert, Cpu, Briefcase,
  LogOut, Users, Database
} from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard, Map, Gauge, TrendingUp, AlertTriangle, Zap,
  ClipboardCheck, Brain, BarChart3, HardHat, Activity, Settings,
  Clock, ShieldAlert, Cpu, Briefcase, Users, Database
};

const NAV = [
  { label: 'Operation Center', path: '/dashboard', icon: 'LayoutDashboard' },
  { label: 'Grid Map', path: '/dashboard/map', icon: 'Map' },
  { label: 'Executive Intel', path: '/dashboard/executive', icon: 'Briefcase', adminOnly: true },
  { label: 'Incident Command', path: '/dashboard/incidents', icon: 'ShieldAlert' },
  { label: 'Timeline Engine', path: '/dashboard/timeline', icon: 'Clock' },
  { label: 'Smart Meters', path: '/dashboard/meters', icon: 'Gauge' },
  { label: 'Demand Forecast', path: '/dashboard/forecasting', icon: 'TrendingUp' },
  { label: 'Anomaly Detection', path: '/dashboard/anomalies', icon: 'AlertTriangle' },
  { label: 'Data Ingestion', path: '/dashboard/ingestion', icon: 'Database', adminOnly: true },
  { label: 'Model Management', path: '/dashboard/models', icon: 'Cpu', adminOnly: true },
  { label: 'User Management', path: '/dashboard/users', icon: 'Users', adminOnly: true },
  { label: 'Grid Stress', path: '/dashboard/grid-stress', icon: 'Zap' },
  { label: 'Field Ops', path: '/dashboard/field', icon: 'HardHat' },
  { label: 'System Health', path: '/dashboard/system', icon: 'Activity', adminOnly: true },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { sidebarOpen, toggleSidebar } = useAppStore();
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <aside className={cn(
      'fixed left-0 top-0 bottom-0 z-40 flex flex-col border-r border-white/[0.06] transition-all duration-300 ease-in-out',
      'bg-[hsl(222,47%,5%)]',
      sidebarOpen ? 'w-64' : 'w-[72px]'
    )}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-white/[0.06]">
        <div className="h-9 w-9 rounded-lg bg-primary/90 flex items-center justify-center flex-shrink-0 shadow-[0_0_20px_rgba(0,229,255,0.3)]">
          <Power className="h-5 w-5 text-primary-foreground" />
        </div>
        {sidebarOpen && (
          <div className="animate-fade-in">
            <span className="text-lg font-bold tracking-tight font-[family-name:var(--font-outfit)] text-glow">VIDYUT</span>
            <p className="text-[10px] text-muted-foreground leading-none tracking-widest uppercase">BESCOM Intelligence</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {NAV.map((item) => {
          if (item.adminOnly && user?.role !== 'admin') return null;
          const Icon = iconMap[item.icon] || LayoutDashboard;
          const isActive = pathname === item.path;
          return (
            <Link key={item.path} href={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative',
                isActive
                  ? 'bg-primary/10 text-primary shadow-[inset_0_0_20px_rgba(0,229,255,0.05)]'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.04]'
              )}>
              {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full shadow-[0_0_8px_rgba(0,229,255,0.5)]" />}
              <Icon className={cn('h-[18px] w-[18px] flex-shrink-0', isActive && 'drop-shadow-[0_0_6px_rgba(0,229,255,0.5)]')} />
              {sidebarOpen && <span className="animate-fade-in truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer Actions */}
      <div className="border-t border-white/[0.06] p-3 space-y-1">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all duration-200"
        >
          <LogOut className="h-[18px] w-[18px] flex-shrink-0" />
          {sidebarOpen && <span className="animate-fade-in">Log Out</span>}
        </button>

        <button onClick={toggleSidebar}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-colors">
          <div className="w-[18px] flex justify-center">
            {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </div>
          {sidebarOpen && <span>Collapse Sidebar</span>}
        </button>
      </div>
    </aside>
  );
}
