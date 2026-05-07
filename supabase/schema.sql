-- ==========================================
-- VIDYUT — Complete Database Schema
-- BESCOM Smart Electricity Intelligence
-- ==========================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ==========================================
-- 1. ROLES & PROFILES
-- ==========================================

CREATE TYPE user_role AS ENUM ('admin', 'supervisor', 'dispatcher', 'analyst', 'field_engineer');

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'analyst',
  avatar_url TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 2. GEOGRAPHIC HIERARCHY
-- ==========================================

CREATE TABLE localities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  zone TEXT,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  population_estimate INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE feeders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  locality_id UUID REFERENCES localities(id),
  capacity_kw DOUBLE PRECISION NOT NULL DEFAULT 1000,
  status TEXT DEFAULT 'healthy' CHECK (status IN ('healthy','warning','critical')),
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE transformers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  feeder_id UUID REFERENCES feeders(id) ON DELETE CASCADE,
  capacity_kva DOUBLE PRECISION NOT NULL DEFAULT 250,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  status TEXT DEFAULT 'healthy' CHECK (status IN ('healthy','warning','critical')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 3. SMART METERS
-- ==========================================

CREATE TYPE meter_type AS ENUM ('residential', 'commercial', 'industrial');
CREATE TYPE meter_status AS ENUM ('active', 'inactive', 'tampered', 'faulty');

CREATE TABLE meters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meter_number TEXT NOT NULL UNIQUE,
  consumer_name TEXT NOT NULL,
  address TEXT,
  feeder_id UUID REFERENCES feeders(id),
  transformer_id UUID REFERENCES transformers(id),
  locality_id UUID REFERENCES localities(id),
  meter_type meter_type DEFAULT 'residential',
  status meter_status DEFAULT 'active',
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  avg_daily_kwh DOUBLE PRECISION DEFAULT 0,
  anomaly_score DOUBLE PRECISION DEFAULT 0,
  risk_level TEXT DEFAULT 'green' CHECK (risk_level IN ('green','amber','red')),
  installed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_meters_feeder ON meters(feeder_id);
CREATE INDEX idx_meters_locality ON meters(locality_id);
CREATE INDEX idx_meters_risk ON meters(risk_level);
CREATE INDEX idx_meters_number ON meters(meter_number);
CREATE INDEX idx_meters_consumer ON meters USING gin(consumer_name gin_trgm_ops);

-- ==========================================
-- 4. METER READINGS (time-series)
-- ==========================================

CREATE TABLE meter_readings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meter_id UUID NOT NULL REFERENCES meters(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL,
  reading_kwh DOUBLE PRECISION NOT NULL,
  voltage DOUBLE PRECISION,
  current_amp DOUBLE PRECISION,
  power_factor DOUBLE PRECISION,
  is_imputed BOOLEAN DEFAULT FALSE,
  imputation_method TEXT,
  quality_flag TEXT DEFAULT 'good' CHECK (quality_flag IN ('good','suspect','imputed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_readings_meter_ts ON meter_readings(meter_id, timestamp DESC);
CREATE INDEX idx_readings_ts ON meter_readings(timestamp DESC);

-- ==========================================
-- 5. WEATHER DATA
-- ==========================================

CREATE TABLE weather_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMPTZ NOT NULL,
  temperature_c DOUBLE PRECISION,
  humidity_percent DOUBLE PRECISION,
  cloud_cover_percent DOUBLE PRECISION,
  rainfall_mm DOUBLE PRECISION DEFAULT 0,
  wind_speed_kmh DOUBLE PRECISION,
  condition TEXT,
  is_holiday BOOLEAN DEFAULT FALSE,
  is_festival BOOLEAN DEFAULT FALSE,
  festival_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_weather_ts ON weather_data(timestamp DESC);

-- ==========================================
-- 6. FORECASTS
-- ==========================================

CREATE TABLE forecasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feeder_id UUID REFERENCES feeders(id),
  locality_id UUID REFERENCES localities(id),
  target_timestamp TIMESTAMPTZ NOT NULL,
  predicted_kwh DOUBLE PRECISION NOT NULL,
  lower_bound DOUBLE PRECISION,
  upper_bound DOUBLE PRECISION,
  confidence DOUBLE PRECISION,
  risk_level TEXT DEFAULT 'green' CHECK (risk_level IN ('green','amber','red')),
  model_version TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_forecasts_feeder ON forecasts(feeder_id, target_timestamp);
CREATE INDEX idx_forecasts_ts ON forecasts(target_timestamp);

-- ==========================================
-- 7. ANOMALIES
-- ==========================================

CREATE TYPE anomaly_type AS ENUM (
  'sudden_zero_drop','repeated_identical','post_midnight_spike',
  'rapid_reconnection','seasonal_inversion','billing_cycle_dip',
  'peer_deviation','isolation_forest'
);
CREATE TYPE anomaly_status AS ENUM ('new','investigating','confirmed','resolved','false_positive');

CREATE TABLE anomalies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meter_id UUID NOT NULL REFERENCES meters(id),
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  anomaly_type anomaly_type NOT NULL,
  confidence_score DOUBLE PRECISION NOT NULL CHECK (confidence_score BETWEEN 0 AND 1),
  risk_level TEXT DEFAULT 'amber' CHECK (risk_level IN ('green','amber','red')),
  status anomaly_status DEFAULT 'new',
  z_score DOUBLE PRECISION,
  expected_kwh DOUBLE PRECISION,
  actual_kwh DOUBLE PRECISION,
  deviation_percent DOUBLE PRECISION,
  peer_avg_kwh DOUBLE PRECISION,
  description TEXT,
  rules_triggered TEXT[],
  shap_values JSONB,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_anomalies_meter ON anomalies(meter_id);
CREATE INDEX idx_anomalies_status ON anomalies(status);
CREATE INDEX idx_anomalies_risk ON anomalies(risk_level);
CREATE INDEX idx_anomalies_detected ON anomalies(detected_at DESC);
CREATE INDEX idx_anomalies_confidence ON anomalies(confidence_score DESC);

-- ==========================================
-- 8. ANOMALY RULES CONFIG
-- ==========================================

CREATE TABLE anomaly_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  description TEXT,
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low','medium','high','critical')),
  threshold DOUBLE PRECISION DEFAULT 0.7,
  weight DOUBLE PRECISION DEFAULT 1.0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 9. INSPECTIONS
-- ==========================================

CREATE TYPE inspection_status AS ENUM ('pending','assigned','investigating','resolved');
CREATE TYPE inspection_outcome AS ENUM ('confirmed_theft','faulty_meter','false_positive','inconclusive');

CREATE TABLE inspections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  anomaly_id UUID REFERENCES anomalies(id),
  meter_id UUID NOT NULL REFERENCES meters(id),
  priority INT NOT NULL DEFAULT 100,
  confidence_score DOUBLE PRECISION,
  status inspection_status DEFAULT 'pending',
  assigned_to UUID REFERENCES profiles(id),
  assigned_at TIMESTAMPTZ,
  outcome inspection_outcome,
  notes TEXT,
  photos TEXT[],
  gps_lat DOUBLE PRECISION,
  gps_lng DOUBLE PRECISION,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inspections_status ON inspections(status);
CREATE INDEX idx_inspections_assigned ON inspections(assigned_to);
CREATE INDEX idx_inspections_priority ON inspections(priority);

-- ==========================================
-- 10. INCIDENTS (Phase 7 - Enterprise)
-- ==========================================

CREATE TYPE incident_status AS ENUM ('detected', 'verified', 'assigned', 'investigating', 'escalated', 'resolved', 'archived');
CREATE TYPE incident_priority AS ENUM ('low', 'medium', 'high', 'critical');

CREATE TABLE incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  status incident_status DEFAULT 'detected',
  priority incident_priority DEFAULT 'medium',
  anomaly_id UUID REFERENCES anomalies(id),
  feeder_id UUID REFERENCES feeders(id),
  meter_id UUID REFERENCES meters(id),
  inspection_id UUID REFERENCES inspections(id),
  owner_id UUID REFERENCES profiles(id),
  escalated_to UUID REFERENCES profiles(id),
  supervisor_id UUID REFERENCES profiles(id),
  comments JSONB DEFAULT '[]',
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_priority ON incidents(priority);

-- ==========================================
-- 11. FEEDBACK LOOP
-- ==========================================

CREATE TABLE feedback_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inspection_id UUID REFERENCES inspections(id),
  anomaly_id UUID REFERENCES anomalies(id),
  outcome inspection_outcome,
  was_correct BOOLEAN,
  feedback_notes TEXT,
  submitted_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 11. MODEL METRICS
-- ==========================================

CREATE TABLE model_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  model_name TEXT NOT NULL,
  version TEXT NOT NULL,
  accuracy DOUBLE PRECISION,
  precision_score DOUBLE PRECISION,
  recall DOUBLE PRECISION,
  f1_score DOUBLE PRECISION,
  false_positive_rate DOUBLE PRECISION,
  training_samples INT,
  trained_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 12. THRESHOLD CONFIGURATION
-- ==========================================

CREATE TABLE threshold_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  config_key TEXT NOT NULL UNIQUE,
  config_value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 13. INGESTION LOGS
-- ==========================================

CREATE TYPE ingestion_status AS ENUM ('processing','completed','failed','partial');

CREATE TABLE ingestion_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  filename TEXT NOT NULL,
  total_rows INT DEFAULT 0,
  processed_rows INT DEFAULT 0,
  failed_rows INT DEFAULT 0,
  duplicate_rows INT DEFAULT 0,
  status ingestion_status DEFAULT 'processing',
  errors JSONB,
  uploaded_by UUID REFERENCES profiles(id),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 14. NOTIFICATIONS
-- ==========================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT DEFAULT 'info' CHECK (severity IN ('info','warning','critical')),
  is_read BOOLEAN DEFAULT FALSE,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);

-- ==========================================
-- 15. ACTIVITY LOGS
-- ==========================================

CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT DEFAULT 'info',
  user_id UUID REFERENCES profiles(id),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_ts ON activity_logs(created_at DESC);

-- ==========================================
-- 16. AUDIT LOGS
-- ==========================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  user_name TEXT,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_ts ON audit_logs(created_at DESC);

-- ==========================================
-- 17. SYSTEM HEALTH SNAPSHOTS
-- ==========================================

CREATE TABLE system_health (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  api_latency_ms DOUBLE PRECISION,
  db_connections INT,
  db_health TEXT DEFAULT 'healthy',
  ingestion_rate DOUBLE PRECISION,
  model_health TEXT DEFAULT 'healthy',
  realtime_sync TEXT DEFAULT 'connected',
  uptime_hours DOUBLE PRECISION,
  metadata JSONB,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 18. DASHBOARD STATS (materialized view)
-- ==========================================

CREATE TABLE dashboard_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  total_meters INT DEFAULT 0,
  active_feeders INT DEFAULT 0,
  active_anomalies INT DEFAULT 0,
  high_risk_feeders INT DEFAULT 0,
  current_demand_mw DOUBLE PRECISION DEFAULT 0,
  theft_alerts INT DEFAULT 0,
  outage_count INT DEFAULT 0,
  grid_health_score DOUBLE PRECISION DEFAULT 0,
  ai_confidence DOUBLE PRECISION DEFAULT 0,
  daily_forecast_accuracy DOUBLE PRECISION DEFAULT 0,
  inspections_pending INT DEFAULT 0,
  inspections_resolved_today INT DEFAULT 0,
  computed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- ROW LEVEL SECURITY
-- ==========================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE meters ENABLE ROW LEVEL SECURITY;
ALTER TABLE meter_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE anomalies ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all, update own
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Meters: all authenticated users can read
CREATE POLICY "meters_select" ON meters FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "meters_insert" ON meters FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'dispatcher'))
);

-- Readings: all authenticated can read
CREATE POLICY "readings_select" ON meter_readings FOR SELECT USING (auth.role() = 'authenticated');

-- Anomalies: all can read, admin/dispatcher can update
CREATE POLICY "anomalies_select" ON anomalies FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "anomalies_update" ON anomalies FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'dispatcher'))
);

-- Inspections: all can read, assigned engineer or admin can update
CREATE POLICY "inspections_select" ON inspections FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "inspections_update" ON inspections FOR UPDATE USING (
  assigned_to = auth.uid() OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'dispatcher'))
);

-- Notifications: users see own
CREATE POLICY "notifications_select" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "notifications_update" ON notifications FOR UPDATE USING (user_id = auth.uid());

-- ==========================================
-- REALTIME PUBLICATIONS
-- ==========================================

ALTER PUBLICATION supabase_realtime ADD TABLE anomalies;
ALTER PUBLICATION supabase_realtime ADD TABLE inspections;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE activity_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE dashboard_stats;
ALTER PUBLICATION supabase_realtime ADD TABLE system_health;

-- ==========================================
-- AUTO-UPDATE TIMESTAMPS
-- ==========================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_profiles_updated BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_meters_updated BEFORE UPDATE ON meters FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_anomalies_updated BEFORE UPDATE ON anomalies FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_inspections_updated BEFORE UPDATE ON inspections FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_feeders_updated BEFORE UPDATE ON feeders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
