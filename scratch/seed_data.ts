import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!; // Use service role to bypass RLS

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedData() {
  console.log('🚀 Starting Grid Data Seeding...');

  // 1. Seed Meters
  const meters = [
    { id: 'MTR-IND-001', location_name: 'Indiranagar 12th Main', status: 'active', type: 'industrial' },
    { id: 'MTR-BTM-042', location_name: 'BTM Layout 2nd Stage', status: 'active', type: 'residential' },
    { id: 'MTR-HEB-088', location_name: 'Hebbal Flyover Junction', status: 'active', type: 'commercial' },
    { id: 'MTR-WHT-105', location_name: 'Whitefield ITPL Road', status: 'active', type: 'industrial' },
    { id: 'MTR-KOR-022', location_name: 'Koramangala 4th Block', status: 'active', type: 'residential' },
  ];

  const { error: mError } = await supabase.from('meters').upsert(meters);
  if (mError) {
    console.error('❌ Meter Seeding Failed:', mError);
    return;
  }
  console.log('✅ Meters seeded.');

  // 2. Seed Anomalies
  const anomalies = [
    { 
      id: 'anom-001', 
      meter_id: 'MTR-IND-001', 
      type: 'Sudden Load Drop', 
      confidence_score: 0.94, 
      risk_level: 0.88, 
      status: 'detected', 
      description: 'Pattern matches typical illegal bypass signature. Voltage remains stable while current drops by 80%.',
      detected_at: new Date(Date.now() - 3600000).toISOString()
    },
    { 
      id: 'anom-002', 
      meter_id: 'MTR-BTM-042', 
      type: 'Meter Tampering', 
      confidence_score: 0.82, 
      risk_level: 0.75, 
      status: 'investigating', 
      description: 'Physical tilt sensor triggered at 02:44 AM. Possible cover removal attempt.',
      detected_at: new Date(Date.now() - 7200000).toISOString()
    },
    { 
      id: 'anom-003', 
      meter_id: 'MTR-HEB-088', 
      type: 'Reverse Power Flow', 
      confidence_score: 0.98, 
      risk_level: 0.95, 
      status: 'verified', 
      description: 'Unregistered back-feeding detected. Likely unauthorized solar integration or grid feedback loop.',
      detected_at: new Date(Date.now() - 14400000).toISOString()
    },
    { 
      id: 'anom-004', 
      meter_id: 'MTR-WHT-105', 
      type: 'High Frequency Noise', 
      confidence_score: 0.65, 
      risk_level: 0.40, 
      status: 'detected', 
      description: 'Harmonic distortion above threshold. Possible industrial motor failure nearby.',
      detected_at: new Date(Date.now() - 86400000).toISOString()
    }
  ];

  const { error: aError } = await supabase.from('anomalies').upsert(anomalies);
  if (aError) {
    console.error('❌ Anomaly Seeding Failed:', aError);
    return;
  }
  console.log('✅ Anomalies seeded.');

  // 3. Seed Incidents (linked to anomalies)
  const incidents = [
    {
      title: 'Critical Theft Detected: Indiranagar',
      description: 'High-confidence bypass detected at industrial meter MTR-IND-001. Estimated revenue loss: ₹42,000/day.',
      status: 'detected',
      priority: 'critical',
      anomaly_id: 'anom-001'
    },
    {
      title: 'Tamper Alert: BTM Layout',
      description: 'Physical cover alert on residential meter MTR-BTM-042. Dispatch requested for inspection.',
      status: 'investigating',
      priority: 'high',
      anomaly_id: 'anom-002'
    }
  ];

  const { error: iError } = await supabase.from('incidents').upsert(incidents);
  if (iError) {
    console.error('❌ Incident Seeding Failed:', iError);
  } else {
    console.log('✅ Incidents seeded.');
  }

  console.log('🎉 Database Bootstrapped Successfully!');
}

seedData();
