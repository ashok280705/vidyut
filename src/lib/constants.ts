// ==========================================
// VIDYUT - Application Constants
// ==========================================

export const APP_NAME = 'VIDYUT';
export const APP_TAGLINE = 'Smart Electricity Intelligence Platform';
export const APP_DESCRIPTION = 'AI-powered demand forecasting, theft detection, and grid intelligence for BESCOM';

// BESCOM Localities in Bangalore
export const LOCALITIES = [
  'Koramangala', 'Indiranagar', 'Whitefield', 'Electronic City',
  'Jayanagar', 'Malleshwaram', 'Rajajinagar', 'BTM Layout',
  'HSR Layout', 'Marathahalli', 'Yelahanka', 'Banashankari',
  'Basavanagudi', 'JP Nagar', 'Hebbal', 'Bommanahalli',
  'KR Puram', 'Mahadevapura', 'Dasarahalli', 'RR Nagar',
] as const;

export const FEEDER_NAMES = [
  'KMG-F01', 'KMG-F02', 'IND-F01', 'IND-F02', 'WTF-F01', 'WTF-F02',
  'ELC-F01', 'ELC-F02', 'JYN-F01', 'JYN-F02', 'MLW-F01', 'MLW-F02',
  'RJN-F01', 'BTM-F01', 'BTM-F02', 'HSR-F01', 'HSR-F02', 'MRT-F01',
  'YLK-F01', 'BNK-F01', 'BSV-F01', 'JPN-F01', 'HBL-F01', 'BOM-F01',
] as const;

export const ANOMALY_RULES = {
  sudden_zero_drop: { label: 'Sudden Zero Drop', description: 'Reading dropped to zero unexpectedly', severity: 'high' },
  repeated_identical: { label: 'Repeated Identical', description: 'Same reading repeated consecutively', severity: 'medium' },
  post_midnight_spike: { label: 'Post-Midnight Spike', description: 'Unusual spike after midnight hours', severity: 'high' },
  rapid_reconnection: { label: 'Rapid Reconnection', description: 'Frequent disconnect-reconnect pattern', severity: 'critical' },
  seasonal_inversion: { label: 'Seasonal Inversion', description: 'Consumption pattern inverts seasonal norm', severity: 'medium' },
  billing_cycle_dip: { label: 'Billing Cycle Dip', description: 'Consistent dip near billing cycle', severity: 'high' },
  peer_deviation: { label: 'Peer Deviation', description: 'Significant deviation from peer group', severity: 'medium' },
  isolation_forest: { label: 'Isolation Forest', description: 'Statistical anomaly detected by model', severity: 'medium' },
} as const;

export const INSPECTION_OUTCOMES = {
  confirmed_theft: { label: 'Confirmed Theft', color: 'red' },
  faulty_meter: { label: 'Faulty Meter', color: 'amber' },
  false_positive: { label: 'False Positive', color: 'gray' },
  inconclusive: { label: 'Inconclusive', color: 'blue' },
} as const;

export const NAV_ITEMS = [
  { label: 'Operation Center', path: '/dashboard', icon: 'LayoutDashboard' },
  { label: 'Grid Map', path: '/dashboard/map', icon: 'Map' },
  { label: 'Smart Meters', path: '/dashboard/meters', icon: 'Gauge' },
  { label: 'Demand Forecast', path: '/dashboard/forecasting', icon: 'TrendingUp' },
  { label: 'Anomaly Detection', path: '/dashboard/anomalies', icon: 'AlertTriangle' },
  { label: 'Grid Stress', path: '/dashboard/grid-stress', icon: 'Zap' },
  { label: 'Inspections', path: '/dashboard/inspections', icon: 'ClipboardCheck' },
  { label: 'Explainable AI', path: '/dashboard/explainability', icon: 'Brain' },
  { label: 'Analytics', path: '/dashboard/analytics', icon: 'BarChart3' },
  { label: 'Field Ops', path: '/dashboard/field', icon: 'HardHat' },
  { label: 'System Health', path: '/dashboard/system', icon: 'Activity' },
  { label: 'Administration', path: '/dashboard/admin', icon: 'Settings' },
] as const;

export const BANGALORE_CENTER = { lat: 12.9716, lng: 77.5946 };

export const RISK_THRESHOLDS = {
  green: { max: 0.3, label: 'Low Risk' },
  amber: { max: 0.7, label: 'Medium Risk' },
  red: { max: 1.0, label: 'High Risk' },
} as const;
