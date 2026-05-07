import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type {
  DashboardStats, Anomaly, Feeder, Meter, Forecast, Inspection,
  GridStress, WeatherData, ActivityItem, SystemHealth, IngestionLog,
  ModelMetrics, MeterReading, Incident
} from '@/types';
import * as mock from '@/lib/mock-data';

// Lazy-initialized Supabase client — avoids module-load timing issues
// where NEXT_PUBLIC_ env vars haven't been inlined yet.
let _supabase: SupabaseClient | null = null;
let _initialized = false;

function getSupabase(): SupabaseClient | null {
  if (_initialized) return _supabase;
  _initialized = true;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (url && key) {
    _supabase = createClient(url, key);
    console.log('[VIDYUT] Supabase services client created:', url.substring(0, 30) + '...');
  } else {
    console.warn('[VIDYUT] Supabase env vars missing — using mock data. URL:', !!url, 'KEY:', !!key);
  }
  return _supabase;
}

export const getClient = () => getSupabase();

export type MapEntity = { id: string; lat: number; lng: number; type: 'meter' | 'feeder' | 'anomaly'; label: string; risk: number; status: string; metadata: any };

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const sb = getSupabase();
  if (!sb) return mock.generateDashboardStats();
  try {
    const { data, error } = await sb.from('dashboard_stats').select('*').single();
    if (error) throw error;
    console.log('[VIDYUT] fetchDashboardStats:', data ? 'from Supabase' : 'fallback to mock');
    return data || mock.generateDashboardStats();
  } catch (err) {
    console.error('[VIDYUT] fetchDashboardStats error:', err);
    return mock.generateDashboardStats();
  }
}


export async function fetchFeeders(): Promise<Feeder[]> {
  const sb = getSupabase();
  if (!sb) return mock.generateFeeders();
  try {
    const { data, error } = await sb.from('feeders').select('*');
    if (error) throw error;
    console.log('[VIDYUT] fetchFeeders:', data?.length ?? 0, 'rows');
    return (data && data.length > 0 ? data : mock.generateFeeders()) as unknown as Feeder[];
  } catch (err) {
    console.error('[VIDYUT] fetchFeeders error:', err);
    return mock.generateFeeders();
  }
}

export async function fetchInspections(): Promise<Inspection[]> {
  const sb = getSupabase();
  if (!sb) return mock.generateInspections();
  try {
    const { data, error } = await sb.from('inspections').select('*');
    if (error) throw error;
    console.log('[VIDYUT] fetchInspections:', data?.length ?? 0, 'rows');
    return (data && data.length > 0 ? data : mock.generateInspections()) as unknown as Inspection[];
  } catch (err) {
    console.error('[VIDYUT] fetchInspections error:', err);
    return mock.generateInspections();
  }
}

export async function fetchActivity(limit?: number): Promise<ActivityItem[]> {
  const sb = getSupabase();
  if (!sb) return mock.generateActivity(limit);
  try {
    const { data, error } = await sb.from('activity_logs').select('*').limit(limit || 20);
    if (error) throw error;
    return (data && data.length > 0 ? data : mock.generateActivity(limit)) as ActivityItem[];
  } catch { return mock.generateActivity(limit); }
}

export async function fetchWeather(): Promise<WeatherData> {
  return mock.generateWeather();
}

export async function fetchNotifications(): Promise<ActivityItem[]> {
  return mock.generateActivity(5);
}

export async function fetchSystemHealth(): Promise<SystemHealth> {
  const sb = getSupabase();
  if (!sb) return mock.generateSystemHealth();
  try {
    const { data, error } = await sb.from('system_health').select('*').single();
    if (error) throw error;
    return data || mock.generateSystemHealth();
  } catch { return mock.generateSystemHealth(); }
}

export async function fetchIngestionLogs(): Promise<IngestionLog[]> {
  return mock.generateIngestionLogs();
}

export async function fetchMapEntities(): Promise<MapEntity[]> {
  const arr: MapEntity[] = [];
  mock.generateFeeders().forEach(f => arr.push({ 
    id: f.id, 
    lat: f.lat ?? 12.97, 
    lng: f.lng ?? 77.59, 
    type: 'feeder', 
    label: f.name, 
    risk: f.utilization ?? 0, 
    status: f.status, 
    metadata: {} 
  }));
  mock.generateAnomalies().forEach(a => arr.push({ 
    id: a.id, 
    lat: 12.97 + (Math.random()-0.5)*0.1, 
    lng: 77.64 + (Math.random()-0.5)*0.1, 
    type: 'anomaly', 
    label: a.id, 
    risk: a.confidence_score ?? 0, 
    status: a.status, 
    metadata: {} 
  }));
  return arr;
}

export async function fetchAnomalies(params?: { status?: string; risk_level?: string; limit?: number }): Promise<Anomaly[]> {
  const sb = getSupabase();
  if (!sb) {
    console.warn('[VIDYUT] fetchAnomalies: no Supabase client, returning mock data');
    return mock.generateAnomalies();
  }
  try {
    let query = sb
      .from('anomalies')
      .select('*, meter:meters(meter_number, consumer_name, address)');
    
    if (params?.status && params.status !== 'all') {
      query = query.eq('status', params.status);
    }
    if (params?.risk_level && params.risk_level !== 'all') {
      query = query.eq('risk_level', params.risk_level);
    }

    if (params?.limit) {
      query = query.limit(params.limit);
    }

    const { data, error } = await query.order('detected_at', { ascending: false });
    if (error) throw error;

    console.log('[VIDYUT] fetchAnomalies:', data?.length ?? 0, 'rows from Supabase');

    if (!data || data.length === 0) return mock.generateAnomalies();

    // Transform for UI (flatten meter details)
    return (data || []).map((d: any) => ({
      ...d,
      meter_number: d.meter?.meter_number || 'Unknown',
      consumer_name: d.meter?.consumer_name || 'N/A',
      rules_triggered: d.rules_triggered || [],
      deviation_percent: d.deviation_percent || 0,
      peer_avg_kwh: d.peer_avg_kwh || 0
    })) as Anomaly[];
  } catch (err) {
    console.error('[VIDYUT] fetchAnomalies error:', err);
    return mock.generateAnomalies();
  }
}

export async function fetchIncidents(params?: { status?: string; limit?: number }): Promise<Incident[]> {
  const sb = getSupabase();
  if (!sb) return [];
  try {
    let query = sb.from('incidents').select('*, owner:profiles!owner_id(full_name), supervisor:profiles!supervisor_id(full_name)');
    if (params?.status && params.status !== 'all') {
      query = query.eq('status', params.status);
    }
    const { data, error } = await query.order('created_at', { ascending: false }).limit(params?.limit || 50);
    if (error) throw error;
    return (data || []) as Incident[];
  } catch (err) {
    console.error('[VIDYUT] fetchIncidents error:', err);
    return [];
  }
}

export async function fetchDemandHistory(days: number): Promise<{ timestamp: string; demand: number; forecast: number }[]> {
  const sb = getSupabase();
  if (!sb) return mock.generateDemandHistory(days);
  try {
    const { data } = await sb.from('forecasts').select('*').limit(48);
    if (!data || data.length === 0) return mock.generateDemandHistory(days);
    return data.map((d: any) => ({ timestamp: d.timestamp, demand: d.p50 + (Math.random()*10 - 5), forecast: d.p50 }));
  } catch { return mock.generateDemandHistory(days); }
}

export async function fetchMeters(params?: { limit?: number; page?: number; perPage?: number; risk?: string; type?: string; search?: string }): Promise<{ items: Meter[]; total: number }> {
  const all = mock.generateMeters(params?.limit || 100);
  return { items: all.slice(0, 50), total: all.length };
}

export async function fetchModelMetrics(): Promise<ModelMetrics[]> {
  return mock.generateModelMetrics();
}

export async function fetchForecasts(): Promise<Forecast[]> {
  const sb = getSupabase();
  if (!sb) return mock.generateForecasts();
  try {
    const { data } = await sb.from('forecasts').select('*').limit(48);
    return (data && data.length > 0 ? data : mock.generateForecasts()) as Forecast[];
  } catch { return mock.generateForecasts(); }
}

export async function fetchGridStress(): Promise<GridStress[]> {
  return mock.generateGridStress();
}
