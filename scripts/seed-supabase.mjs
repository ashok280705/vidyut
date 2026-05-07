/**
 * VIDYUT — Supabase Database Seeder v2
 * Respects FK constraints: localities → feeders → transformers → meters → anomalies
 * 
 * Usage: node scripts/seed-supabase.mjs
 */

import { readFileSync } from 'fs';

const SUPABASE_URL = 'https://tmqgbmxjjpydcyfdgrzm.supabase.co';
const envContent = readFileSync('.env', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...rest] = line.split('=');
  if (key && rest.length) envVars[key.trim()] = rest.join('=').trim();
});
const KEY = envVars.SUPABASE_SERVICE_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!KEY) { console.error('No Supabase key in .env'); process.exit(1); }

const H = {
  'apikey': KEY, 'Authorization': `Bearer ${KEY}`,
  'Content-Type': 'application/json', 'Prefer': 'return=minimal',
};

async function insert(table, rows) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, { method: 'POST', headers: H, body: JSON.stringify(rows) });
  if (!r.ok) { console.error(`  ❌ ${table}:`, (await r.text()).substring(0, 250)); return false; }
  console.log(`  ✅ ${table}: ${rows.length} rows`);
  return true;
}
async function query(table, select = 'id', limit = 500) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=${select}&limit=${limit}`, { headers: H });
  return await r.json();
}

const rand = (a, b) => Math.random() * (b - a) + a;
const randInt = (a, b) => Math.floor(rand(a, b));
const pick = arr => arr[randInt(0, arr.length)];
const uuid = () => crypto.randomUUID();
const f = (v, d = 2) => parseFloat(v.toFixed(d));

const NAMES = ['Rajesh Kumar','Priya Sharma','Anil Reddy','Kavitha S','Suresh M','Lakshmi B','Venkat R','Meena K','Harish G','Divya P','Ramesh N','Sunitha D','Manoj T','Deepa L','Kiran A','Anitha V','Srinivas H','Pooja M','Naveen J','Swathi R','Prakash G','Rekha M','Vivek S','Asha R','Girish K'];
const ATYPES = ['sudden_zero_drop','repeated_identical','post_midnight_spike','rapid_reconnection','seasonal_inversion','billing_cycle_dip','peer_deviation','isolation_forest'];

async function main() {
  console.log('🔌 VIDYUT Database Seeder v2\n============================');

  // 1. Get existing localities
  const localities = await query('localities', 'id,name');
  console.log(`\n📍 Localities: ${localities.length} exist`);
  if (localities.length === 0) { console.error('No localities! Run seed.sql first.'); process.exit(1); }
  const locIds = localities.map(l => l.id);

  // 2. Seed more feeders (need ~20 total)
  let feeders = await query('feeders', 'id,code,locality_id');
  console.log(`\n📡 Feeders: ${feeders.length} exist`);
  if (feeders.length < 15) {
    const CODES = ['KMG-F01','KMG-F02','IND-F02','WTF-F02','ELC-F01','ELC-F02','JYN-F01','JYN-F02','MLW-F02','RJN-F01','BTM-F01','BTM-F02','HSR-F01','HSR-F02','MRT-F01','YLK-F01','BNK-F01'];
    const existingCodes = new Set(feeders.map(f => f.code));
    const newFeeders = CODES.filter(c => !existingCodes.has(c)).map(code => ({
      id: uuid(), code, name: `Feeder ${code}`,
      locality_id: pick(locIds),
      capacity_kw: randInt(1000, 5000),
      status: pick(['healthy', 'healthy', 'healthy', 'warning', 'critical']),
      lat: f(12.9 + rand(-0.12, 0.12)), lng: f(77.5 + rand(-0.15, 0.15)),
    }));
    if (newFeeders.length > 0) await insert('feeders', newFeeders);
    feeders = await query('feeders', 'id,code,locality_id');
  }
  const feederIds = feeders.map(f => f.id);

  // 3. Seed transformers for feeders that don't have any
  let transformers = await query('transformers', 'id,feeder_id');
  console.log(`\n🔧 Transformers: ${transformers.length} exist`);
  const feedersWithTx = new Set(transformers.map(t => t.feeder_id));
  const newTxs = [];
  for (const fid of feederIds) {
    if (!feedersWithTx.has(fid)) {
      for (let j = 0; j < randInt(1, 3); j++) {
        newTxs.push({
          id: uuid(), name: `TR-${fid.substring(0, 4)}-${j}`,
          feeder_id: fid, capacity_kva: pick([250, 500, 1000]),
          lat: f(12.9 + rand(-0.12, 0.12)), lng: f(77.5 + rand(-0.15, 0.15)),
          status: pick(['healthy', 'healthy', 'warning']),
        });
      }
    }
  }
  if (newTxs.length > 0) {
    for (let i = 0; i < newTxs.length; i += 25) await insert('transformers', newTxs.slice(i, i + 25));
  }
  transformers = await query('transformers', 'id,feeder_id');
  const txIds = transformers.map(t => t.id);
  // Map feeder → transformer for FK assignment
  const feederToTx = {};
  transformers.forEach(t => { if (!feederToTx[t.feeder_id]) feederToTx[t.feeder_id] = []; feederToTx[t.feeder_id].push(t.id); });

  // 4. Seed meters
  let meters = await query('meters', 'id');
  console.log(`\n📊 Meters: ${meters.length} exist`);
  if (meters.length < 10) {
    // Delete stray empty meters first
    if (meters.length > 0 && meters.length < 5) {
      for (const m of meters) {
        await fetch(`${SUPABASE_URL}/rest/v1/meters?id=eq.${m.id}`, { method: 'DELETE', headers: H });
      }
      console.log(`  🗑️ Cleaned ${meters.length} stray meters`);
    }

    const newMeters = [];
    for (let i = 0; i < 200; i++) {
      const fid = pick(feederIds);
      const txList = feederToTx[fid] || txIds;
      const score = f(rand(0, 1), 3);
      newMeters.push({
        id: uuid(),
        meter_number: `BES${String(100000 + i).padStart(7, '0')}`,
        consumer_name: pick(NAMES),
        address: `${randInt(1, 500)}, ${pick(localities).name}`,
        feeder_id: fid,
        transformer_id: pick(txList),
        locality_id: pick(locIds),
        meter_type: pick(['residential', 'commercial', 'industrial']),
        status: Math.random() > 0.05 ? 'active' : pick(['inactive', 'tampered', 'faulty']),
        lat: f(12.9 + rand(-0.12, 0.12)), lng: f(77.5 + rand(-0.15, 0.15)),
        avg_daily_kwh: f(rand(5, 50)),
        anomaly_score: score,
        risk_level: score > 0.7 ? 'red' : score > 0.3 ? 'amber' : 'green',
      });
    }
    for (let i = 0; i < newMeters.length; i += 50) {
      await insert('meters', newMeters.slice(i, i + 50));
    }
    meters = await query('meters', 'id');
  }
  const meterIds = meters.map(m => m.id);

  // 5. Seed anomalies
  let anomalies = await query('anomalies', 'id');
  console.log(`\n🚨 Anomalies: ${anomalies.length} exist`);
  if (anomalies.length < 5) {
    const newAnoms = [];
    for (let i = 0; i < 50; i++) {
      const conf = f(rand(0.4, 0.99), 3);
      const exp = f(rand(5, 25));
      const act = f(exp * rand(0.1, 0.6));
      const rules = Array.from({ length: randInt(1, 4) }, () => pick(ATYPES));
      newAnoms.push({
        id: uuid(),
        meter_id: pick(meterIds),
        detected_at: new Date(Date.now() - randInt(0, 7 * 86400000)).toISOString(),
        anomaly_type: pick(ATYPES),
        confidence_score: conf,
        risk_level: conf > 0.7 ? 'red' : conf > 0.4 ? 'amber' : 'green',
        status: pick(['new', 'investigating', 'confirmed', 'resolved', 'false_positive']),
        rules_triggered: rules,
        z_score: f(rand(1.5, 4.5)),
        expected_kwh: exp,
        actual_kwh: act,
        deviation_percent: f((exp - act) / exp * 100),
        peer_avg_kwh: f(exp * rand(0.9, 1.1)),
        description: `Meter deviated ${rand(1.5, 4).toFixed(1)}σ below peer expectation`,
      });
    }
    for (let i = 0; i < newAnoms.length; i += 25) await insert('anomalies', newAnoms.slice(i, i + 25));
  }

  // 6. Seed inspections (no assigned_to FK to avoid profile constraint)
  let inspections = await query('inspections', 'id');
  console.log(`\n🔍 Inspections: ${inspections.length} exist`);
  if (inspections.length < 5) {
    const outcomes = ['confirmed_theft', 'faulty_meter', 'false_positive', 'inconclusive'];
    const newInsp = [];
    for (let i = 0; i < 20; i++) {
      const s = pick(['pending', 'pending', 'assigned', 'investigating', 'resolved']);
      newInsp.push({
        id: uuid(),
        meter_id: pick(meterIds),
        priority: i + 1,
        confidence_score: f(rand(0.5, 0.99), 3),
        status: s,
        outcome: s === 'resolved' ? pick(outcomes) : null,
        notes: s === 'resolved' ? 'Inspection completed. Evidence documented.' : null,
        created_at: new Date(Date.now() - randInt(0, 5 * 86400000)).toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
    await insert('inspections', newInsp);
  }

  // 7. Seed meter_readings for a few meters
  let readings = await query('meter_readings', 'id', 1);
  console.log(`\n📈 Meter readings: checking...`);
  if (readings.length === 0) {
    const sample = meterIds.slice(0, 5);
    for (const mid of sample) {
      const rows = [];
      for (let h = 0; h < 168; h++) { // 7 days of hourly data
        rows.push({
          meter_id: mid,
          timestamp: new Date(Date.now() - h * 3600000).toISOString(),
          reading_kwh: f(10 + Math.sin(h * Math.PI / 12) * 5 + rand(-2, 2)),
          voltage: f(230 + rand(-5, 5)),
          current_amp: f(5 + rand(-2, 2)),
          power_factor: f(0.95 + rand(-0.03, 0.03)),
        });
      }
      for (let i = 0; i < rows.length; i += 50) await insert('meter_readings', rows.slice(i, i + 50));
    }
  }

  // 8. Update dashboard_stats
  console.log('\n📈 Updating dashboard_stats...');
  const r = await fetch(`${SUPABASE_URL}/rest/v1/dashboard_stats?id=not.is.null`, {
    method: 'PATCH', headers: { ...H, 'Prefer': 'return=minimal' },
    body: JSON.stringify({
      total_meters: meterIds.length,
      active_feeders: feederIds.length,
      active_anomalies: 50,
      high_risk_feeders: randInt(3, 6),
      current_demand_mw: f(rand(180, 320), 1),
      theft_alerts: randInt(5, 18),
      inspections_pending: 20,
      computed_at: new Date().toISOString(),
    }),
  });
  console.log(r.ok ? '  ✅ dashboard_stats updated' : '  ❌ ' + await r.text());

  // Final summary
  console.log('\n=============================');
  console.log('📊 Final Database State:');
  for (const t of ['localities','feeders','transformers','meters','anomalies','inspections','activity_logs','forecasts','meter_readings']) {
    const resp = await fetch(`${SUPABASE_URL}/rest/v1/${t}?select=id`, { headers: { ...H, 'Prefer': 'count=exact' }, method: 'HEAD' });
    const range = resp.headers.get('content-range') || '?';
    console.log(`  ${t}: ${range}`);
  }
  console.log('\n✅ Done! Refresh your dashboard at http://localhost:3000/dashboard');
}

main().catch(console.error);
