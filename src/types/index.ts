export type RiskLevel = 'green' | 'amber' | 'red';

export interface DashboardStats {
  total_meters: number;
  active_feeders: number;
  active_anomalies: number;
  high_risk_feeders: number;
  current_demand_mw: number;
  theft_alerts: number;
  outage_count: number;
  grid_health_score: number;
  ai_confidence: number;
  daily_forecast_accuracy: number;
  inspections_pending: number;
  inspections_resolved_today: number;
}

export interface ActivityItem {
  id: string;
  type: 'anomaly' | 'inspection' | 'forecast' | 'ingestion' | 'system' | 'alert' | 'grid' | 'admin' | 'security';
  title: string;
  description: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'critical';
  metadata?: any;
}
export type ActivityLog = ActivityItem;

export interface Feeder {
  id: string;
  code?: string;
  name: string;
  locality_id?: string;
  locality_name?: string;
  capacity_kw?: number;
  current_load_kw?: number;
  utilization: number;
  status: 'healthy' | 'warning' | 'critical' | 'active' | string;
  lat?: number;
  lng?: number;
  gps_lat?: number;
  gps_lng?: number;
  meter_count?: number;
  transformer_count?: number;
}

export interface Meter {
  id: string;
  meter_number: string;
  consumer_name: string;
  address: string;
  feeder_id?: string;
  transformer_id?: string;
  locality: string;
  lat: number;
  lng: number;
  meter_type: 'residential' | 'commercial' | 'industrial';
  status: 'active' | 'inactive' | 'tampered' | 'faulty';
  last_reading: number;
  avg_daily_kwh: number;
  anomaly_score: number;
  risk_level: RiskLevel;
}

export interface Anomaly {
  id: string;
  meter_id?: string;
  meter_number?: string;
  consumer_name?: string;
  locality?: string;
  feeder_name?: string;
  detected_at: string;
  anomaly_type: string;
  confidence_score: number;
  risk_level: RiskLevel;
  status: 'new' | 'investigating' | 'confirmed' | 'resolved' | 'false_positive';
  rules_triggered?: string[];
  z_score?: number;
  expected_kwh?: number;
  actual_kwh?: number;
  deviation_percent?: number;
  peer_avg_kwh?: number;
  description?: string;
  shap_features?: Array<{ feature: string; value: number; contribution: number; direction: 'positive' | 'negative' }>;
}

export interface Forecast {
  id: string;
  feeder_id: string;
  locality: string;
  timestamp: string;
  predicted_kwh: number;
  lower_bound: number;
  upper_bound: number;
  confidence: number;
  risk_level: RiskLevel;
  model_version: string;
}

export interface Inspection {
  id: string;
  anomaly_id?: string;
  meter_id: string;
  priority: number;
  confidence_score?: number;
  status: 'pending' | 'assigned' | 'investigating' | 'resolved';
  assigned_to?: string;
  assigned_engineer_name?: string;
  assigned_at?: string;
  consumer_name?: string;
  meter_number?: string;
  locality?: string;
  address?: string;
  outcome?: 'confirmed_theft' | 'faulty_meter' | 'false_positive' | 'inconclusive';
  notes?: string;
  photos?: string[];
  gps_lat?: number;
  gps_lng?: number;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  meter?: Partial<Meter>;
  engineer?: { full_name: string };
}

export interface Incident {
  id: string;
  title: string;
  description?: string;
  status: 'detected' | 'verified' | 'assigned' | 'investigating' | 'escalated' | 'resolved' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'critical';
  anomaly_id?: string;
  feeder_id?: string;
  meter_id?: string;
  inspection_id?: string;
  owner_id?: string;
  escalated_to?: string;
  supervisor_id?: string;
  comments?: any[];
  resolved_at?: string;
  created_at: string;
  updated_at: string;
  owner?: { full_name: string };
  supervisor?: { full_name: string };
}

export interface GridStress {
  feeder_id: string;
  feeder_name: string;
  current_utilization: number;
  predicted_peak_utilization: number;
  predicted_overload_time?: string;
  risk_level: RiskLevel;
  recommendations: string[];
}

export interface WeatherData {
  timestamp: string;
  temperature_c?: number;
  temperature?: number;
  humidity_percent?: number;
  humidity?: number;
  cloud_cover_percent?: number;
  rainfall_mm?: number;
  wind_speed_kmh?: number;
  condition: string;
  risk_multiplier?: number;
}

export interface SystemHealth {
  status: 'nominal' | 'degraded' | 'critical';
  cpu_usage?: number;
  memory_usage?: number;
  active_connections?: number;
  last_backup?: string;
  api_latency_ms?: number;
  db_connections?: number;
  db_health?: string;
  ingestion_rate?: number;
  model_health?: string;
  realtime_sync?: string;
  last_model_training?: string;
  uptime_hours?: number;
}

export interface IngestionLog {
  id: string;
  filename: string;
  uploaded_at: string;
  total_rows: number;
  processed_rows: number;
  failed_rows: number;
  duplicate_rows: number;
  status: 'processing' | 'completed' | 'failed' | 'partial';
}

export interface ModelMetrics {
  model_name: string;
  version: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  false_positive_rate: number;
  last_trained: string;
  training_samples: number;
}

export interface MeterReading {
  id: string;
  meter_id: string;
  timestamp: string;
  reading_kwh: number;
  voltage: number;
  current: number;
  power_factor: number;
  is_imputed: boolean;
  imputation_method?: string;
  quality_flag: string;
}
