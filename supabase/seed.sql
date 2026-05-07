-- ==========================================
-- VIDYUT — Initial Seed Data
-- ==========================================

-- Clean existing data (optional, useful for resets)
TRUNCATE TABLE 
  system_health, dashboard_stats, audit_logs, activity_logs, notifications, 
  ingestion_logs, threshold_configs, model_metrics, feedback_logs, inspections, 
  anomaly_rules, anomalies, forecasts, weather_data, meter_readings, meters, 
  transformers, feeders, localities, profiles 
CASCADE;

-- ==========================================
-- 1. LOCALITIES
-- ==========================================
INSERT INTO localities (id, name, zone, lat, lng, population_estimate) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Indiranagar', 'East', 12.9784, 77.6408, 120000),
  ('22222222-2222-2222-2222-222222222222', 'Koramangala', 'South', 12.9279, 77.6271, 150000),
  ('33333333-3333-3333-3333-333333333333', 'Whitefield', 'East', 12.9698, 77.7499, 200000),
  ('44444444-4444-4444-4444-444444444444', 'Jayanagar', 'South', 12.9299, 77.5824, 180000),
  ('55555555-5555-5555-5555-555555555555', 'Malleswaram', 'West', 13.0031, 77.5643, 110000);

-- ==========================================
-- 2. FEEDERS & TRANSFORMERS
-- ==========================================
INSERT INTO feeders (id, code, name, locality_id, capacity_kw, status, lat, lng) VALUES
  ('f1111111-1111-1111-1111-111111111111', 'F-IND-01', 'Feeder Indiranagar Main', '11111111-1111-1111-1111-111111111111', 2500, 'warning', 12.9790, 77.6410),
  ('f2222222-2222-2222-2222-222222222222', 'F-KOR-01', 'Feeder Koramangala 100ft', '22222222-2222-2222-2222-222222222222', 3000, 'healthy', 12.9280, 77.6275),
  ('f3333333-3333-3333-3333-333333333333', 'F-WHI-01', 'Feeder Whitefield ITPL', '33333333-3333-3333-3333-333333333333', 5000, 'critical', 12.9700, 77.7500);

INSERT INTO transformers (id, name, feeder_id, capacity_kva, lat, lng, status) VALUES
  ('e1111111-1111-1111-1111-111111111111', 'TR-IND-A', 'f1111111-1111-1111-1111-111111111111', 500, 12.9785, 77.6405, 'warning'),
  ('e2222222-2222-2222-2222-222222222222', 'TR-KOR-B', 'f2222222-2222-2222-2222-222222222222', 500, 12.9275, 77.6270, 'healthy'),
  ('e3333333-3333-3333-3333-333333333333', 'TR-WHI-C', 'f3333333-3333-3333-3333-333333333333', 1000, 12.9695, 77.7495, 'critical');

-- ==========================================
-- 3. SMART METERS
-- ==========================================
INSERT INTO meters (id, meter_number, consumer_name, address, feeder_id, transformer_id, locality_id, meter_type, status, lat, lng, avg_daily_kwh, anomaly_score, risk_level) VALUES
  ('c1111111-1111-1111-1111-111111111111', 'SMR-1001', 'Rahul Sharma', '12th Main, Indiranagar', 'f1111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'residential', 'active', 12.9786, 77.6406, 12.5, 0.1, 'green'),
  ('c2222222-2222-2222-2222-222222222222', 'SMC-2001', 'TechCorp Solutions', '80ft Road, Koramangala', 'f2222222-2222-2222-2222-222222222222', 'e2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'commercial', 'active', 12.9276, 77.6271, 145.2, 0.05, 'green'),
  ('c3333333-3333-3333-3333-333333333333', 'SMI-3001', 'Global Foundry', 'Phase 1, Whitefield', 'f3333333-3333-3333-3333-333333333333', 'e3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'industrial', 'tampered', 12.9696, 77.7496, 850.5, 0.92, 'red'),
  ('c4444444-4444-4444-4444-444444444444', 'SMR-1002', 'Priya Patel', 'CMH Road, Indiranagar', 'f1111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'residential', 'active', 12.9788, 77.6412, 15.1, 0.45, 'amber');

-- ==========================================
-- 4. ANOMALY RULES CONFIG
-- ==========================================
INSERT INTO anomaly_rules (rule_key, label, description, severity, threshold, weight) VALUES
  ('sudden_zero_drop', 'Sudden Zero Drop', 'Meter reading suddenly drops to zero or near zero during peak hours', 'critical', 0.05, 1.5),
  ('repeated_identical', 'Repeated Identical Readings', 'Meter reports the exact same reading multiple times consecutively', 'high', 3, 1.2),
  ('post_midnight_spike', 'Post-Midnight Spike', 'Unusual high consumption between 12 AM and 4 AM', 'high', 2.0, 1.3),
  ('peer_deviation', 'Peer Deviation', 'Consumption deviates significantly from similar peer group', 'medium', 2.0, 1.0);

-- ==========================================
-- 5. ANOMALIES
-- ==========================================
INSERT INTO anomalies (id, meter_id, anomaly_type, confidence_score, risk_level, status, z_score, expected_kwh, actual_kwh, deviation_percent, peer_avg_kwh, description, rules_triggered) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'c3333333-3333-3333-3333-333333333333', 'sudden_zero_drop', 0.92, 'red', 'investigating', 3.5, 850.5, 12.0, -98.5, 800.0, 'Critical drop in industrial consumption indicating potential meter bypass.', ARRAY['sudden_zero_drop', 'peer_deviation']),
  ('a2222222-2222-2222-2222-222222222222', 'c4444444-4444-4444-4444-444444444444', 'post_midnight_spike', 0.65, 'amber', 'new', 2.1, 4.5, 18.2, 304.4, 4.0, 'Unusual spike in consumption during off-peak hours.', ARRAY['post_midnight_spike']);

-- ==========================================
-- 6. DASHBOARD STATS & SYSTEM HEALTH
-- ==========================================
INSERT INTO dashboard_stats (total_meters, active_feeders, active_anomalies, high_risk_feeders, current_demand_mw, theft_alerts, outage_count, grid_health_score, ai_confidence, daily_forecast_accuracy, inspections_pending, inspections_resolved_today) VALUES
  (4, 3, 2, 1, 1450.2, 1, 0, 85.5, 94.2, 92.1, 1, 3);

INSERT INTO system_health (api_latency_ms, db_connections, db_health, ingestion_rate, model_health, realtime_sync, uptime_hours) VALUES
  (45.2, 12, 'healthy', 5400, 'healthy', 'connected', 342.5);

-- ==========================================
-- 7. MODEL METRICS
-- ==========================================
INSERT INTO model_metrics (model_name, version, accuracy, precision_score, recall, f1_score, false_positive_rate, training_samples) VALUES
  ('LightGBM Demand', 'v2.4.1', 0.94, 0.92, 0.95, 0.93, 0.04, 1500000),
  ('Isolation Forest Theft', 'v1.8.0', 0.88, 0.85, 0.91, 0.88, 0.08, 500000);

-- ==========================================
-- 8. GENERATE TIME-SERIES DATA (METER READINGS)
-- ==========================================
-- Generate 7 days of hourly mock readings for meter 1
INSERT INTO meter_readings (meter_id, timestamp, reading_kwh, voltage, current_amp, power_factor)
SELECT 
  'c1111111-1111-1111-1111-111111111111', 
  NOW() - (i || ' hours')::interval, 
  10 + (sin(i * pi() / 12) * 5) + (random() * 2), -- Sine wave + noise
  230 + (random() * 10 - 5), 
  5 + (random() * 2), 
  0.95 + (random() * 0.04)
FROM generate_series(1, 168) i;

-- Generate 7 days of hourly mock readings for meter 2
INSERT INTO meter_readings (meter_id, timestamp, reading_kwh, voltage, current_amp, power_factor)
SELECT 
  'c2222222-2222-2222-2222-222222222222', 
  NOW() - (i || ' hours')::interval, 
  120 + (cos(i * pi() / 12) * 40) + (random() * 10), 
  225 + (random() * 15 - 5), 
  40 + (random() * 10), 
  0.92 + (random() * 0.05)
FROM generate_series(1, 168) i;

-- ==========================================
-- 9. GENERATE FORECASTS
-- ==========================================
-- Generate 24 hours of future forecasts for Feeder 1
INSERT INTO forecasts (feeder_id, target_timestamp, predicted_kwh, lower_bound, upper_bound, confidence, risk_level, model_version)
SELECT 
  'f1111111-1111-1111-1111-111111111111', 
  NOW() + (i || ' hours')::interval, 
  2500 + (sin(i * pi() / 12) * 500) + (random() * 50),
  (2500 + (sin(i * pi() / 12) * 500) + (random() * 50)) * 0.9,
  (2500 + (sin(i * pi() / 12) * 500) + (random() * 50)) * 1.1,
  0.85 + (random() * 0.1),
  CASE WHEN (sin(i * pi() / 12)) > 0.8 THEN 'amber' ELSE 'green' END,
  'v2.4.1'
FROM generate_series(1, 24) i;
