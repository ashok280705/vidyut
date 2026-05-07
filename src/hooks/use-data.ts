'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/client';
import type { DashboardStats, Anomaly, Feeder, Inspection, ActivityItem, WeatherData, Meter, Forecast, GridStress, SystemHealth, IngestionLog, ModelMetrics } from '@/types';
import * as mock from '@/lib/mock-data';

type QueryState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
};

// Generic Supabase query hook with mock fallback
function useSupabaseQuery<T>(
  table: string,
  queryFn: (client: ReturnType<typeof getSupabaseClient>) => Promise<T>,
  mockFn: () => T,
  deps: unknown[] = []
): QueryState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const client = getSupabaseClient();
      if (client && isSupabaseConfigured()) {
        const result = await queryFn(client);
        if (mountedRef.current) setData(result);
      } else {
        // Use mock data fallback
        if (mountedRef.current) setData(mockFn());
      }
    } catch (e: unknown) {
      console.warn(`[VIDYUT] Query failed for ${table}, falling back to mock:`, e);
      if (mountedRef.current) {
        setData(mockFn());
        setError(e instanceof Error ? e.message : 'Unknown error');
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, ...deps]);

  useEffect(() => {
    mountedRef.current = true;
    fetch();
    return () => { mountedRef.current = false; };
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

// ==========================================
// DASHBOARD STATS
// ==========================================

export function useDashboardStats(): QueryState<DashboardStats> {
  return useSupabaseQuery<DashboardStats>(
    'dashboard_stats',
    async (client) => {
      if (!client) throw new Error('No client');
      const { data, error } = await client
        .from('dashboard_stats')
        .select('*')
        .order('computed_at', { ascending: false })
        .limit(1)
        .single();
      if (error) throw error;
      return data as DashboardStats;
    },
    () => mock.generateDashboardStats()
  );
}

// ==========================================
// FEEDERS
// ==========================================

export function useFeeders(): QueryState<Feeder[]> {
  return useSupabaseQuery<Feeder[]>(
    'feeders',
    async (client) => {
      if (!client) throw new Error('No client');
      const { data, error } = await client
        .from('feeders')
        .select(`
          *,
          locality:localities(name),
          meters:meters(count),
          transformers:transformers(count)
        `)
        .order('code');
      if (error) throw error;
      return (data || []).map((f: Record<string, unknown>) => ({
        id: f.id,
        name: f.name,
        code: f.code,
        locality_id: f.locality_id,
        locality_name: (f.locality as Record<string, string>)?.name || '',
        capacity_kw: f.capacity_kw,
        current_load_kw: 0,
        utilization: 0,
        status: f.status,
        lat: f.lat,
        lng: f.lng,
        meter_count: Array.isArray(f.meters) ? f.meters.length : 0,
        transformer_count: Array.isArray(f.transformers) ? f.transformers.length : 0,
      })) as Feeder[];
    },
    () => mock.generateFeeders()
  );
}

// ==========================================
// METERS
// ==========================================

export function useMeters(params?: { page?: number; perPage?: number; risk?: string; type?: string; search?: string }): QueryState<{ items: Meter[]; total: number }> {
  const page = params?.page || 1;
  const perPage = params?.perPage || 25;
  const risk = params?.risk || 'all';
  const type = params?.type || 'all';
  const search = params?.search || '';

  return useSupabaseQuery(
    'meters',
    async (client) => {
      if (!client) throw new Error('No client');
      let query = client.from('meters').select('*, locality:localities(name), feeder:feeders(code)', { count: 'exact' });

      if (risk !== 'all') query = query.eq('risk_level', risk);
      if (type !== 'all') query = query.eq('meter_type', type);
      if (search) query = query.or(`consumer_name.ilike.%${search}%,meter_number.ilike.%${search}%`);

      query = query.range((page - 1) * perPage, page * perPage - 1).order('anomaly_score', { ascending: false });

      const { data, error, count } = await query;
      if (error) throw error;
      return { items: (data || []) as unknown as Meter[], total: count || 0 };
    },
    () => {
      const all = mock.generateMeters(500);
      const filtered = all.filter(m => {
        if (risk !== 'all' && m.risk_level !== risk) return false;
        if (type !== 'all' && m.meter_type !== type) return false;
        if (search && !m.consumer_name.toLowerCase().includes(search.toLowerCase()) && !m.meter_number.includes(search)) return false;
        return true;
      });
      return {
        items: filtered.slice((page - 1) * perPage, page * perPage),
        total: filtered.length,
      };
    },
    [page, perPage, risk, type, search]
  );
}

// ==========================================
// ANOMALIES
// ==========================================

export function useAnomalies(params?: { risk?: string; status?: string; search?: string }): QueryState<Anomaly[]> {
  const risk = params?.risk || 'all';
  const status = params?.status || 'all';
  const search = params?.search || '';

  return useSupabaseQuery<Anomaly[]>(
    'anomalies',
    async (client) => {
      if (!client) throw new Error('No client');
      let query = client.from('anomalies').select(`
        *,
        meter:meters(meter_number, consumer_name, locality:localities(name), feeder:feeders(code, name))
      `);

      if (risk !== 'all') query = query.eq('risk_level', risk);
      if (status !== 'all') query = query.eq('status', status);

      query = query.order('confidence_score', { ascending: false }).limit(100);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as Anomaly[];
    },
    () => {
      const all = mock.generateAnomalies(30);
      return all.filter(a => {
        if (risk !== 'all' && a.risk_level !== risk) return false;
        if (status !== 'all' && a.status !== status) return false;
        if (search && !(a.consumer_name || '').toLowerCase().includes(search.toLowerCase()) && !(a.meter_number || '').includes(search)) return false;
        return true;
      });
    },
    [risk, status, search]
  );
}

// ==========================================
// FORECASTS
// ==========================================

export function useForecasts(hours: number = 24): QueryState<Forecast[]> {
  return useSupabaseQuery<Forecast[]>(
    'forecasts',
    async (client) => {
      if (!client) throw new Error('No client');
      const { data, error } = await client
        .from('forecasts')
        .select('*')
        .gte('target_timestamp', new Date().toISOString())
        .order('target_timestamp')
        .limit(hours);
      if (error) throw error;
      return (data || []) as unknown as Forecast[];
    },
    () => mock.generateForecasts(hours),
    [hours]
  );
}

// ==========================================
// INSPECTIONS
// ==========================================

export function useInspections(statusFilter?: string): QueryState<Inspection[]> {
  return useSupabaseQuery<Inspection[]>(
    'inspections',
    async (client) => {
      if (!client) throw new Error('No client');
      let query = client.from('inspections').select(`
        *,
        meter:meters(meter_number, consumer_name, address, locality:localities(name)),
        engineer:profiles!assigned_to(full_name)
      `);
      if (statusFilter && statusFilter !== 'all') query = query.eq('status', statusFilter);
      query = query.order('priority').limit(50);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as Inspection[];
    },
    () => {
      const all = mock.generateInspections(20);
      if (statusFilter && statusFilter !== 'all') return all.filter(i => i.status === statusFilter);
      return all;
    },
    [statusFilter]
  );
}

// ==========================================
// GRID STRESS
// ==========================================

export function useGridStress(): QueryState<GridStress[]> {
  return useSupabaseQuery<GridStress[]>(
    'grid_stress',
    async () => { throw new Error('Not yet implemented'); },
    () => mock.generateGridStress()
  );
}

// ==========================================
// WEATHER
// ==========================================

export function useWeather(): QueryState<WeatherData> {
  return useSupabaseQuery<WeatherData>(
    'weather_data',
    async (client) => {
      if (!client) throw new Error('No client');
      const { data, error } = await client
        .from('weather_data')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();
      if (error) throw error;
      return data as WeatherData;
    },
    () => mock.generateWeather()
  );
}

// ==========================================
// ACTIVITY FEED
// ==========================================

export function useActivityFeed(limit: number = 20): QueryState<ActivityItem[]> {
  return useSupabaseQuery<ActivityItem[]>(
    'activity_logs',
    async (client) => {
      if (!client) throw new Error('No client');
      const { data, error } = await client
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data || []).map((d: Record<string, unknown>) => ({
        id: d.id, type: d.type, title: d.title, description: d.description,
        timestamp: d.created_at, severity: d.severity,
      })) as ActivityItem[];
    },
    () => mock.generateActivity(limit),
    [limit]
  );
}

// ==========================================
// DEMAND HISTORY
// ==========================================

export function useDemandHistory(days: number = 7): QueryState<{ timestamp: string; demand: number; forecast: number }[]> {
  return useSupabaseQuery(
    'demand_history',
    async () => { throw new Error('Not yet'); },
    () => mock.generateDemandHistory(days),
    [days]
  );
}

// ==========================================
// SYSTEM HEALTH
// ==========================================

export function useSystemHealth(): QueryState<SystemHealth> {
  return useSupabaseQuery<SystemHealth>(
    'system_health',
    async (client) => {
      if (!client) throw new Error('No client');
      const { data, error } = await client
        .from('system_health')
        .select('*')
        .order('recorded_at', { ascending: false })
        .limit(1)
        .single();
      if (error) throw error;
      return data as SystemHealth;
    },
    () => mock.generateSystemHealth()
  );
}

// ==========================================
// INGESTION LOGS
// ==========================================

export function useIngestionLogs(): QueryState<IngestionLog[]> {
  return useSupabaseQuery<IngestionLog[]>(
    'ingestion_logs',
    async (client) => {
      if (!client) throw new Error('No client');
      const { data, error } = await client
        .from('ingestion_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data || []) as IngestionLog[];
    },
    () => mock.generateIngestionLogs()
  );
}

// ==========================================
// MODEL METRICS
// ==========================================

export function useModelMetrics(): QueryState<ModelMetrics[]> {
  return useSupabaseQuery<ModelMetrics[]>(
    'model_metrics',
    async (client) => {
      if (!client) throw new Error('No client');
      const { data, error } = await client
        .from('model_metrics')
        .select('*')
        .order('trained_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as ModelMetrics[];
    },
    () => mock.generateModelMetrics()
  );
}

// ==========================================
// REALTIME SUBSCRIPTIONS
// ==========================================

export function useRealtimeSubscription(
  table: string,
  callback: (payload: { eventType: string; new: Record<string, unknown>; old: Record<string, unknown> }) => void
) {
  useEffect(() => {
    const client = getSupabaseClient();
    if (!client || !isSupabaseConfigured()) return;

    const channel = client
      .channel(`realtime:${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, (payload: any) => {
        callback({
          eventType: payload.eventType,
          new: payload.new as Record<string, unknown>,
          old: payload.old as Record<string, unknown>,
        });
      })
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [table, callback]);
}
