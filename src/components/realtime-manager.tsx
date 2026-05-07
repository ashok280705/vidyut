'use client';

import { useEffect, useCallback } from 'react';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/toast';
import { useAppStore } from '@/stores/app-store';

/**
 * Realtime manager — subscribes to Supabase realtime events
 * and dispatches them as toasts + store updates.
 */
export function RealtimeManager() {
  const { addToast } = useToast();
  const { init } = useAppStore();

  const handleRealtimeEvent = useCallback((table: string, eventType: string, record: Record<string, unknown>) => {
    switch (table) {
      case 'anomalies':
        if (eventType === 'INSERT') {
          addToast({
            type: 'warning',
            title: 'New Anomaly Detected',
            description: `${record.anomaly_type} — Confidence: ${((record.confidence_score as number) * 100).toFixed(0)}%`,
            duration: 8000,
          });
        }
        break;

      case 'inspections':
        if (eventType === 'UPDATE' && record.status === 'resolved') {
          addToast({
            type: 'success',
            title: 'Inspection Resolved',
            description: `Outcome: ${record.outcome}`,
          });
        }
        break;

      case 'activity_logs':
        if (record.severity === 'critical') {
          addToast({
            type: 'error',
            title: record.title as string,
            description: record.description as string,
            duration: 10000,
          });
        }
        break;

      case 'dashboard_stats':
        // Refresh dashboard data
        init();
        break;
    }
  }, [addToast, init]);

  useEffect(() => {
    const client = getSupabaseClient();
    if (!client || !isSupabaseConfigured()) return;

    const tables = ['anomalies', 'inspections', 'activity_logs', 'dashboard_stats', 'notifications'];
    const channels = tables.map(table =>
      client
        .channel(`rt:${table}`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
          handleRealtimeEvent(table, payload.eventType, payload.new as Record<string, unknown>);
        })
        .subscribe()
    );

    return () => {
      channels.forEach(ch => client.removeChannel(ch));
    };
  }, [handleRealtimeEvent]);

  return null;
}
