import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatNumber(num: number, decimals = 0): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toFixed(decimals);
}

export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function getRiskColor(level: string): string {
  switch (level) {
    case 'green':
    case 'healthy':
      return '#22c55e';
    case 'amber':
    case 'warning':
      return '#f59e0b';
    case 'red':
    case 'critical':
      return '#ef4444';
    default:
      return '#6b7280';
  }
}

export function getRiskBg(level: string): string {
  switch (level) {
    case 'green':
    case 'healthy':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    case 'amber':
    case 'warning':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    case 'red':
    case 'critical':
      return 'bg-red-500/10 text-red-400 border-red-500/20';
    default:
      return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
  }
}

export function getStatusBg(status: string): string {
  switch (status) {
    case 'new':
    case 'pending':
      return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    case 'assigned':
    case 'investigating':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    case 'confirmed':
    case 'resolved':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    case 'false_positive':
      return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    default:
      return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
  }
}

export function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}
