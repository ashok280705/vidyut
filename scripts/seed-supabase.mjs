/**
 * VIDYUT — Supabase Database Seeder
 * Populates meters, anomalies, inspections, and activity_logs
 * with realistic Bangalore electricity grid data.
 * 
 * Usage: node scripts/seed-supabase.mjs
 */

const SUPABASE_URL = 'https://tmqgbmxjjpydcyfdgrzm.supabase.co';

// Read from .env file
import { readFileSync } from 'fs';
const envContent = readFileSync('.env', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...rest] = line.split('=');
  if (key && rest.length) envVars[key.trim()] = rest.join('=').trim();
});

const SUPABASE_KEY = envVars.SUPABASE_SERVICE_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_KEY) {
  console.error('ERROR: No Supabase key found in .env');
  process.exit(1);
}

const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=minimal',
};

async function supaInsert(table, rows) {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(rows),
  });
  if (!resp.ok) {
    const text = await resp.text();
    console.error(`  ❌ ${table}: ${resp.status} ${text.substring(0, 300)}`);
    return false;
  }
  console.log(`  ✅ ${table}: ${rows.length} rows inserted`);
  return true;
}

async function supaCount(table) {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=id&limit=1`, { headers });
  const data = await resp.json();
  if (Array.isArray(data)) return data.length;
  return 0;
}

function rand(min, max) { return Math.random() * (max - min) + min; }
function randInt(min, max) { return Math.floor(rand(min, max)); }
function pick(arr) { return arr[randInt(0, arr.length)]; }
function uuid() { return crypto.randomUUID(); }

const LOCALITIES = [
  'Koramangala', 'Indiranagar', 'Whitefield', 'Electronic City',
  'Jayanagar', 'Malleshwaram', 'Rajajinagar', 'BTM Layout',
  'HSR Layout', 'Marathahalli', 'Yelahanka', 'Banashankari',
  'Basavanagudi', 'JP Nagar', 'Hebbal', 'Bommanahalli',
  'KR Puram', 'Mahadevapura', 'Dasarahalli', 'RR Nagar',
];

const NAMES = [
  'Rajesh Kumar', 'Priya Sharma', 'Anil Reddy', 'Kavitha S', 'Suresh M',
  'Lakshmi B', 'Venkat R', 'Meena K', 'Harish G', 'Divya P',
  'Ramesh N', 'Sunitha D', 'Manoj T', 'Deepa L', 'Kiran A',
  'Anitha V', 'Srinivas H', 'Pooja M', 'Naveen J', 'Swathi R',
  'Prakash G', 'Rekha M', 'Vivek S', 'Asha R', 'Girish K',
  'Bhavani T', 'Mohan D', 'Geeta N', 'Ashok P', 'Nandini L',
];

const ANOMALY_TYPES = [
  'sudden_zero_drop', 'repeated_identical', 'post_midnight_spike',
  'rapid_reconnection', 'seasonal_inversion', 'billing_cycle_dip',
  'peer_deviation', 'isolation_forest',
];

const FEEDER_CODES = [
  'KMG-F01', 'KMG-F02', 'IND-F01', 'IND-F02', 'WTF-F01', 'WTF-F02',
  'ELC-F01', 'ELC-F02', 'JYN-F01', 'JYN-F02', 'MLW-F01', 'MLW-F02',
  'RJN-F01', 'BTM-F01', 'BTM-F02', 'HSR-F01', 'HSR-F02', 'MRT-F01',
  'YLK-F01', 'BNK-F01', 'BSV-F01', 'JPN-F01', 'HBL-F01', 'BOM-F01',
];

async function getFeederIds() {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/feeders?select=id`, { headers });
  const data = await resp.json();
  return data.map(r => r.id);
}

async function seedFeeders() {
  console.log('\n📡 Seeding feeders...');
  const existing = await getFeederIds();
  if (existing.length >= 20) {
    console.log(`  ⏭️  Already have ${existing.length} feeders, skipping`);
    return existing;
  }

  // Schema: id, code, name, locality_id, capacity_kw, status, lat, lng, created_at, updated_at
  const feeders = FEEDER_CODES.slice(existing.length).map((code, i) => ({
    id: uuid(),
    code,
    name: `Feeder ${code}`,
    locality_id: uuid(),
    capacity_kw: randInt(500, 2000),
    status: pick(['healthy', 'warning', 'critical']),
    lat: 12.9 + rand(-0.15, 0.15),
    lng: 77.5 + rand(-0.15, 0.15),
  }));

  await supaInsert('feeders', feeders);
  return await getFeederIds();
}

async function seedMeters(feederIds) {
  console.log('\n📊 Seeding meters...');
  const count = await supaCount('meters');
  if (count > 0) {
    console.log('  ⏭️  Meters already exist, skipping');
    const resp = await fetch(`${SUPABASE_URL}/rest/v1/meters?select=id&limit=300`, { headers });
    return (await resp.json()).map(r => r.id);
  }

  // Schema: id, meter_number, consumer_name, address, feeder_id, transformer_id, locality, 
  //         meter_type, status, lat, lng, anomaly_score, avg_daily_kwh, risk_level, last_reading,
  //         created_at, updated_at
  const meters = [];
  const METER_COUNT = 200;
  for (let i = 0; i < METER_COUNT; i++) {
    const score = rand(0, 1);
    const risk = score > 0.7 ? 'red' : score > 0.3 ? 'amber' : 'green';
    meters.push({
      id: uuid(),
      meter_number: `BES${String(100000 + i).padStart(7, '0')}`,
      consumer_name: pick(NAMES),
      address: `${randInt(1, 500)}, ${pick(LOCALITIES)}`,
      feeder_id: pick(feederIds),
      transformer_id: `txf-${i % 60}`,
      locality: pick(LOCALITIES),
      lat: 12.9 + rand(-0.15, 0.15),
      lng: 77.5 + rand(-0.15, 0.15),
      meter_type: pick(['residential', 'commercial', 'industrial']),
      status: Math.random() > 0.05 ? 'active' : pick(['inactive', 'tampered', 'faulty']),
      last_reading: parseFloat(rand(0.5, 15).toFixed(2)),
      avg_daily_kwh: parseFloat(rand(5, 50).toFixed(2)),
      anomaly_score: parseFloat(score.toFixed(3)),
      risk_level: risk,
    });
  }

  // Insert in batches
  for (let i = 0; i < meters.length; i += 50) {
    await supaInsert('meters', meters.slice(i, i + 50));
  }
  return meters.map(m => m.id);
}

async function seedAnomalies(meterIds) {
  console.log('\n🚨 Seeding anomalies...');
  const count = await supaCount('anomalies');
  if (count > 0) {
    console.log('  ⏭️  Anomalies already exist, skipping');
    return;
  }

  // Schema: id, meter_id, detected_at, anomaly_type, confidence_score, risk_level, status,
  //         rules_triggered, z_score, expected_kwh, actual_kwh, deviation_percent, peer_avg_kwh,
  //         description, (no shap_features), created_at, updated_at
  const anomalies = [];
  const COUNT = 50;
  for (let i = 0; i < COUNT; i++) {
    const conf = rand(0.4, 0.99);
    const exp = rand(5, 25);
    const act = exp * rand(0.1, 0.6);
    const rules = Array.from({ length: randInt(1, 4) }, () => pick(ANOMALY_TYPES));

    anomalies.push({
      id: uuid(),
      meter_id: pick(meterIds),
      detected_at: new Date(Date.now() - randInt(0, 7 * 86400000)).toISOString(),
      anomaly_type: pick(ANOMALY_TYPES),
      confidence_score: parseFloat(conf.toFixed(3)),
      risk_level: conf > 0.7 ? 'red' : conf > 0.4 ? 'amber' : 'green',
      status: pick(['new', 'investigating', 'confirmed', 'resolved', 'false_positive']),
      rules_triggered: rules,
      z_score: parseFloat(rand(1.5, 4.5).toFixed(2)),
      expected_kwh: parseFloat(exp.toFixed(2)),
      actual_kwh: parseFloat(act.toFixed(2)),
      deviation_percent: parseFloat(((exp - act) / exp * 100).toFixed(2)),
      peer_avg_kwh: parseFloat((exp * rand(0.9, 1.1)).toFixed(2)),
      description: `Meter deviated ${rand(1.5, 4).toFixed(1)}σ below peer expectation`,
    });
  }

  for (let i = 0; i < anomalies.length; i += 25) {
    await supaInsert('anomalies', anomalies.slice(i, i + 25));
  }
}

async function seedInspections(meterIds) {
  console.log('\n🔍 Seeding inspections...');
  const count = await supaCount('inspections');
  if (count > 0) {
    console.log('  ⏭️  Inspections already exist, skipping');
    return;
  }

  const statuses = ['pending', 'assigned', 'investigating', 'resolved'];
  const outcomes = ['confirmed_theft', 'faulty_meter', 'false_positive', 'inconclusive'];
  const inspections = [];

  for (let i = 0; i < 25; i++) {
    const s = pick(statuses);
    inspections.push({
      id: uuid(),
      meter_id: pick(meterIds),
      priority: i + 1,
      confidence_score: parseFloat(rand(0.5, 0.99).toFixed(3)),
      status: s,
      assigned_to: s !== 'pending' ? uuid() : null,
      outcome: s === 'resolved' ? pick(outcomes) : null,
      notes: s === 'resolved' ? 'Inspection completed. Evidence documented.' : null,
      created_at: new Date(Date.now() - randInt(0, 5 * 86400000)).toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  await supaInsert('inspections', inspections);
}

async function seedActivityLogs() {
  console.log('\n📜 Seeding activity_logs...');
  const count = await supaCount('activity_logs');
  if (count > 0) {
    console.log('  ⏭️  Activity logs already exist, skipping');
    return;
  }

  // Schema: id, type, title, description, severity, ?, ?, created_at
  // Using only columns we know exist
  const templates = [
    { type: 'anomaly', title: 'New anomaly detected', severity: 'warning' },
    { type: 'alert', title: 'Theft alert raised', severity: 'critical' },
    { type: 'inspection', title: 'Inspection completed', severity: 'info' },
    { type: 'forecast', title: 'Demand spike predicted', severity: 'warning' },
    { type: 'system', title: 'Model retrained', severity: 'info' },
    { type: 'ingestion', title: 'Data batch ingested', severity: 'info' },
    { type: 'grid', title: 'Feeder overload warning', severity: 'critical' },
    { type: 'admin', title: 'User access granted', severity: 'info' },
  ];

  const logs = [];
  for (let i = 0; i < 30; i++) {
    const t = pick(templates);
    const loc = pick(LOCALITIES);
    logs.push({
      id: uuid(),
      type: t.type,
      title: t.title,
      description: `${t.title} in ${loc} zone — auto-generated event`,
      severity: t.severity,
    });
  }

  await supaInsert('activity_logs', logs);
}

async function updateDashboardStats(meterCount) {
  console.log('\n📈 Updating dashboard_stats...');
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/dashboard_stats?id=not.is.null`, {
    method: 'PATCH',
    headers: { ...headers, 'Prefer': 'return=minimal' },
    body: JSON.stringify({
      total_meters: meterCount,
      active_feeders: 24,
      active_anomalies: 50,
      high_risk_feeders: randInt(3, 6),
      current_demand_mw: parseFloat(rand(180, 320).toFixed(1)),
      theft_alerts: randInt(5, 18),
      inspections_pending: 25,
      computed_at: new Date().toISOString(),
    }),
  });

  if (resp.ok) {
    console.log('  ✅ dashboard_stats updated');
  } else {
    console.error('  ❌ dashboard_stats update failed:', await resp.text());
  }
}

async function main() {
  console.log('🔌 VIDYUT Database Seeder');
  console.log('========================');
  console.log('Target:', SUPABASE_URL);
  console.log('Key type:', SUPABASE_KEY.includes('service_role') ? 'service_role' : 'anon');

  const feederIds = await seedFeeders();
  const meterIds = await seedMeters(feederIds);
  await seedAnomalies(meterIds);
  await seedInspections(meterIds);
  await seedActivityLogs();
  await updateDashboardStats(meterIds.length);

  console.log('\n✅ Seeding complete! Refresh your dashboard to see real data.');
}

main().catch(console.error);
