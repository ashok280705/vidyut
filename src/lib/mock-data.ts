import { LOCALITIES, FEEDER_NAMES } from './constants';
import type { DashboardStats, ActivityItem, Anomaly, Feeder, Meter, Forecast, Inspection, GridStress, WeatherData, IngestionLog, SystemHealth, ModelMetrics, MeterReading, RiskLevel } from '@/types';
import { generateId } from './utils';

function rand(min: number, max: number) { return Math.random() * (max - min) + min; }
function randInt(min: number, max: number) { return Math.floor(rand(min, max)); }
function pick<T>(arr: readonly T[]): T { return arr[randInt(0, arr.length)]; }

const NAMES = ['Rajesh Kumar','Priya Sharma','Anil Reddy','Kavitha S','Suresh M','Lakshmi B','Venkat R','Meena K','Harish G','Divya P','Ramesh N','Sunitha D','Manoj T','Deepa L','Kiran A','Anitha V','Srinivas H','Pooja M','Naveen J','Swathi R'];

export function generateFeeders(): Feeder[] {
  return FEEDER_NAMES.map((code, i) => {
    const util = rand(0.3, 0.95);
    const cap = randInt(500, 2000);
    return {
      id: `feeder-${i}`, name: `Feeder ${code}`, code,
      locality_id: `loc-${i % 20}`, locality_name: LOCALITIES[i % 20],
      capacity_kw: cap, current_load_kw: Math.round(cap * util),
      utilization: util, status: util > 0.85 ? 'critical' : util > 0.7 ? 'warning' : 'healthy',
      lat: 12.9 + rand(-0.15, 0.15), lng: 77.5 + rand(-0.15, 0.15),
      meter_count: randInt(20, 80), transformer_count: randInt(2, 8),
    };
  });
}

export function generateMeters(count = 500): Meter[] {
  return Array.from({ length: count }, (_, i) => {
    const score = rand(0, 1);
    const risk: RiskLevel = score > 0.7 ? 'red' : score > 0.3 ? 'amber' : 'green';
    return {
      id: `meter-${i}`, meter_number: `BES${String(100000 + i).padStart(7, '0')}`,
      consumer_name: pick(NAMES), address: `${randInt(1, 500)}, ${pick(LOCALITIES)}`,
      feeder_id: `feeder-${i % 24}`, transformer_id: `txf-${i % 60}`,
      locality: pick(LOCALITIES), lat: 12.9 + rand(-0.15, 0.15), lng: 77.5 + rand(-0.15, 0.15),
      meter_type: pick(['residential', 'commercial', 'industrial'] as const),
      status: Math.random() > 0.05 ? 'active' : pick(['inactive', 'tampered', 'faulty'] as const),
      last_reading: rand(0.5, 15), avg_daily_kwh: rand(5, 50),
      anomaly_score: score, risk_level: risk,
    };
  });
}

export function generateDashboardStats(): DashboardStats {
  return {
    total_meters: 12847, active_feeders: 24, active_anomalies: randInt(15, 45),
    high_risk_feeders: randInt(2, 6), current_demand_mw: rand(180, 320),
    theft_alerts: randInt(5, 18), outage_count: randInt(0, 4),
    grid_health_score: rand(82, 98), ai_confidence: rand(88, 97),
    daily_forecast_accuracy: rand(91, 98), inspections_pending: randInt(8, 25),
    inspections_resolved_today: randInt(3, 12),
  };
}

export function generateActivity(count = 20): ActivityItem[] {
  const types: ActivityItem['type'][] = ['anomaly', 'inspection', 'forecast', 'ingestion', 'system', 'alert'];
  const severities: ActivityItem['severity'][] = ['info', 'warning', 'critical'];
  const templates = [
    { type: 'anomaly' as const, title: 'New anomaly detected', desc: (l: string) => `Suspicious pattern on meter in ${l}` },
    { type: 'alert' as const, title: 'Theft alert raised', desc: (l: string) => `High confidence theft signal in ${l}` },
    { type: 'inspection' as const, title: 'Inspection completed', desc: (l: string) => `Field inspection resolved in ${l}` },
    { type: 'forecast' as const, title: 'Demand spike predicted', desc: (l: string) => `Peak demand expected in ${l} zone` },
    { type: 'system' as const, title: 'Model retrained', desc: () => `LightGBM model v2.4 deployed successfully` },
    { type: 'ingestion' as const, title: 'Data ingested', desc: () => `${randInt(1000, 5000)} readings processed` },
  ];
  return Array.from({ length: count }, (_, i) => {
    const t = pick(templates);
    const loc = pick(LOCALITIES);
    return {
      id: generateId(), type: t.type, title: t.title, description: t.desc(loc),
      timestamp: new Date(Date.now() - i * randInt(60000, 600000)).toISOString(),
      severity: pick(severities),
    };
  });
}

export function generateAnomalies(count = 30): Anomaly[] {
  const types: Anomaly['anomaly_type'][] = ['sudden_zero_drop','repeated_identical','post_midnight_spike','rapid_reconnection','seasonal_inversion','billing_cycle_dip','peer_deviation','isolation_forest'];
  return Array.from({ length: count }, (_, i) => {
    const conf = rand(0.4, 0.99);
    const exp = rand(5, 25); const act = exp * rand(0.1, 0.6);
    return {
      id: `anom-${i}`, meter_id: `meter-${randInt(0, 500)}`,
      meter_number: `BES${String(100000 + randInt(0, 500)).padStart(7, '0')}`,
      consumer_name: pick(NAMES), locality: pick(LOCALITIES), feeder_name: pick(FEEDER_NAMES),
      detected_at: new Date(Date.now() - randInt(0, 7 * 86400000)).toISOString(),
      anomaly_type: pick(types), confidence_score: conf,
      risk_level: conf > 0.7 ? 'red' : conf > 0.4 ? 'amber' : 'green',
      status: pick(['new', 'investigating', 'confirmed', 'resolved', 'false_positive'] as const),
      rules_triggered: Array.from({ length: randInt(1, 4) }, () => pick(types)),
      z_score: rand(1.5, 4.5), expected_kwh: exp, actual_kwh: act,
      deviation_percent: ((exp - act) / exp) * 100, peer_avg_kwh: exp * rand(0.9, 1.1),
      description: `Meter deviated ${rand(1.5, 4).toFixed(1)}σ below peer expectation`,
      shap_features: [
        { feature: 'Consumption Drop', value: rand(-5, -1), contribution: rand(0.2, 0.5), direction: 'negative' as const },
        { feature: 'Time Pattern', value: rand(0, 1), contribution: rand(0.1, 0.3), direction: 'positive' as const },
        { feature: 'Peer Deviation', value: rand(-3, -1), contribution: rand(0.15, 0.35), direction: 'negative' as const },
        { feature: 'Historical Trend', value: rand(-2, 2), contribution: rand(0.05, 0.2), direction: rand(0, 1) > 0.5 ? 'positive' as const : 'negative' as const },
      ],
    };
  });
}

export function generateForecasts(hours = 48): Forecast[] {
  const base = rand(200, 350);
  return Array.from({ length: hours }, (_, i) => {
    const h = (new Date().getHours() + i) % 24;
    const seasonal = Math.sin((h - 6) * Math.PI / 12) * 80;
    const pred = base + seasonal + rand(-20, 20);
    const spread = rand(10, 30);
    return {
      id: `fc-${i}`, feeder_id: `feeder-${i % 24}`, locality: pick(LOCALITIES),
      timestamp: new Date(Date.now() + i * 3600000).toISOString(),
      predicted_kwh: pred, lower_bound: pred - spread, upper_bound: pred + spread,
      confidence: rand(0.85, 0.98),
      risk_level: pred > base + 60 ? 'red' : pred > base + 30 ? 'amber' : 'green',
      model_version: 'v2.4.1',
    };
  });
}

export function generateInspections(count = 20): Inspection[] {
  const statuses: Inspection['status'][] = ['pending', 'assigned', 'investigating', 'resolved'];
  const outcomes: Inspection['outcome'][] = ['confirmed_theft', 'faulty_meter', 'false_positive', 'inconclusive'];
  return Array.from({ length: count }, (_, i) => {
    const s = pick(statuses);
    return {
      id: `insp-${i}`, anomaly_id: `anom-${i}`, meter_id: `meter-${randInt(0, 500)}`,
      meter_number: `BES${String(100000 + randInt(0, 500)).padStart(7, '0')}`,
      consumer_name: pick(NAMES), address: `${randInt(1, 500)}, ${pick(LOCALITIES)}`,
      locality: pick(LOCALITIES), priority: i + 1, confidence_score: rand(0.5, 0.99),
      status: s, assigned_to: s !== 'pending' ? `eng-${randInt(1, 10)}` : undefined,
      assigned_engineer_name: s !== 'pending' ? pick(NAMES) : undefined,
      outcome: s === 'resolved' ? pick(outcomes) : undefined,
      notes: s === 'resolved' ? 'Inspection completed. Evidence documented.' : undefined,
      created_at: new Date(Date.now() - randInt(0, 5 * 86400000)).toISOString(),
      updated_at: new Date().toISOString(),
    };
  });
}

export function generateGridStress(): GridStress[] {
  return FEEDER_NAMES.slice(0, 12).map((name, i) => {
    const util = rand(0.5, 0.98);
    return {
      feeder_id: `feeder-${i}`, feeder_name: `Feeder ${name}`,
      current_utilization: util, predicted_peak_utilization: Math.min(util + rand(0.05, 0.2), 1),
      predicted_overload_time: util > 0.85 ? new Date(Date.now() + randInt(1, 6) * 3600000).toISOString() : undefined,
      risk_level: util > 0.85 ? 'red' : util > 0.7 ? 'amber' : 'green',
      recommendations: util > 0.7 ? ['Consider load shedding', 'Alert maintenance team', 'Redistribute load'] : ['Normal operations'],
    };
  });
}

export function generateWeather(): WeatherData {
  return {
    timestamp: new Date().toISOString(), temperature_c: rand(24, 38),
    humidity_percent: rand(40, 85), cloud_cover_percent: rand(0, 80),
    rainfall_mm: Math.random() > 0.7 ? rand(0, 25) : 0,
    wind_speed_kmh: rand(5, 25), condition: pick(['Clear', 'Partly Cloudy', 'Cloudy', 'Light Rain', 'Thunderstorm']),
  };
}

export function generateDemandHistory(days = 7): { timestamp: string; demand: number; forecast: number }[] {
  const data: { timestamp: string; demand: number; forecast: number }[] = [];
  for (let d = days; d >= 0; d--) {
    for (let h = 0; h < 24; h++) {
      const base = 220;
      const seasonal = Math.sin((h - 6) * Math.PI / 12) * 80;
      const demand = base + seasonal + rand(-15, 15);
      data.push({
        timestamp: new Date(Date.now() - d * 86400000 + h * 3600000).toISOString(),
        demand, forecast: demand + rand(-10, 10),
      });
    }
  }
  return data;
}

export function generateReadings(meterId: string, days = 7): MeterReading[] {
  return Array.from({ length: days * 96 }, (_, i) => ({
    id: `rd-${meterId}-${i}`, meter_id: meterId,
    timestamp: new Date(Date.now() - (days * 96 - i) * 900000).toISOString(),
    reading_kwh: rand(0.2, 5), voltage: rand(220, 240), current: rand(1, 15),
    power_factor: rand(0.85, 1), is_imputed: Math.random() < 0.05,
    imputation_method: Math.random() < 0.05 ? 'forward_fill' : undefined,
    quality_flag: Math.random() < 0.05 ? 'imputed' : Math.random() < 0.1 ? 'suspect' : 'good',
  }));
}

export function generateSystemHealth(): SystemHealth {
  return {
    status: 'nominal',
    api_latency_ms: rand(12, 85), db_connections: randInt(15, 45),
    db_health: 'healthy', ingestion_rate: rand(100, 500),
    model_health: 'healthy', realtime_sync: 'connected',
    last_model_training: new Date(Date.now() - 2 * 86400000).toISOString(),
    uptime_hours: rand(200, 720),
  };
}

export function generateModelMetrics(): ModelMetrics[] {
  return [
    { model_name: 'LightGBM Demand', version: 'v2.4.1', accuracy: 0.943, precision: 0.921, recall: 0.918, f1_score: 0.919, false_positive_rate: 0.042, last_trained: new Date(Date.now() - 2 * 86400000).toISOString(), training_samples: 245000 },
    { model_name: 'Isolation Forest', version: 'v1.8.0', accuracy: 0.891, precision: 0.867, recall: 0.845, f1_score: 0.856, false_positive_rate: 0.078, last_trained: new Date(Date.now() - 3 * 86400000).toISOString(), training_samples: 180000 },
    { model_name: 'Peer Comparison', version: 'v3.1.2', accuracy: 0.912, precision: 0.895, recall: 0.878, f1_score: 0.886, false_positive_rate: 0.056, last_trained: new Date(Date.now() - 1 * 86400000).toISOString(), training_samples: 310000 },
  ];
}

export function generateIngestionLogs(): IngestionLog[] {
  return Array.from({ length: 10 }, (_, i) => ({
    id: `ing-${i}`, filename: `meter_readings_batch_${1000 + i}.csv`,
    uploaded_at: new Date(Date.now() - i * 3600000 * 4).toISOString(),
    total_rows: randInt(5000, 20000), processed_rows: randInt(4800, 19800),
    failed_rows: randInt(0, 200), duplicate_rows: randInt(0, 50),
    status: i === 0 ? 'processing' : pick(['completed', 'completed', 'completed', 'partial'] as const),
  }));
}
