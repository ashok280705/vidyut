'use client';

import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { X, AlertTriangle, CheckCircle, Info, ShieldAlert } from 'lucide-react';

interface Toast {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType>({
  toasts: [],
  addToast: () => {},
  removeToast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, toast.duration || 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-96">
        {toasts.map(toast => (
          <div key={toast.id}
            className={cn(
              'glass-card rounded-xl p-4 flex items-start gap-3 animate-slide-up shadow-lg',
              toast.type === 'error' && 'border-red-500/30',
              toast.type === 'warning' && 'border-amber-500/30',
              toast.type === 'success' && 'border-emerald-500/30',
            )}>
            {toast.type === 'error' && <ShieldAlert className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />}
            {toast.type === 'warning' && <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />}
            {toast.type === 'success' && <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />}
            {toast.type === 'info' && <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{toast.title}</p>
              {toast.description && <p className="text-xs text-muted-foreground mt-0.5">{toast.description}</p>}
            </div>
            <button onClick={() => removeToast(toast.id)} className="flex-shrink-0 p-1 hover:bg-white/[0.04] rounded">
              <X className="h-3 w-3 text-muted-foreground" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
