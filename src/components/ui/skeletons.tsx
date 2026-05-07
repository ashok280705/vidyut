import { cn } from '@/lib/utils';

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('stat-card animate-pulse', className)}>
      <div className="h-3 w-20 bg-white/[0.06] rounded mb-3" />
      <div className="h-6 w-24 bg-white/[0.06] rounded mb-2" />
      <div className="h-2 w-16 bg-white/[0.04] rounded" />
    </div>
  );
}

export function SkeletonChart({ className, height = 280 }: { className?: string; height?: number }) {
  return (
    <div className={cn('glass-card rounded-xl p-6 animate-pulse', className)}>
      <div className="h-3 w-32 bg-white/[0.06] rounded mb-4" />
      <div className="rounded-lg bg-white/[0.03]" style={{ height }} />
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 5, className }: { rows?: number; cols?: number; className?: string }) {
  return (
    <div className={cn('glass-card rounded-xl overflow-hidden animate-pulse', className)}>
      <div className="p-4 border-b border-white/[0.06]">
        <div className="h-3 w-28 bg-white/[0.06] rounded" />
      </div>
      <div className="p-4 space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4">
            {Array.from({ length: cols }).map((_, j) => (
              <div key={j} className="h-3 bg-white/[0.04] rounded flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 6, className }: { count?: number; className?: string }) {
  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
