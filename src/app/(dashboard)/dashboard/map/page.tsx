'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { APIProvider, Map, AdvancedMarker, InfoWindow, useMap } from '@vis.gl/react-google-maps';
import { useAppStore } from '@/stores/app-store';
import { fetchMapEntities, type MapEntity } from '@/services/supabase-services';
import { cn } from '@/lib/utils';
import {
  Layers, Filter, ZoomIn, ZoomOut, Crosshair, AlertTriangle,
  Zap, Gauge, MapPin, X, TrendingUp, Shield, Activity, ChevronRight
} from 'lucide-react';

const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || '';
const BANGALORE_CENTER = { lat: 12.9716, lng: 77.5946 };

// Enterprise dark map style
const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#0a0e1a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#4a6b8a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0a0e1a' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#1a2540' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#0e1525' }] },
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#141d30' }] },
  { featureType: 'road', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#060a14' }] },
  { featureType: 'water', elementType: 'labels', stylers: [{ visibility: 'off' }] },
];

// Marker colors by type and risk
function getMarkerColor(entity: MapEntity): string {
  if (entity.type === 'anomaly') return '#ef4444';
  if (entity.type === 'feeder') return '#00e5ff';
  if (entity.risk > 0.7) return '#ef4444';
  if (entity.risk > 0.3) return '#f59e0b';
  return '#22c55e';
}

function getMarkerSize(entity: MapEntity, zoom: number): number {
  const base = entity.type === 'feeder' ? 14 : entity.type === 'anomaly' ? 12 : 8;
  const zoomFactor = Math.max(0.5, Math.min(2, (zoom - 10) / 4));
  return Math.round(base * zoomFactor);
}

// Custom marker element
function EntityMarker({ entity, zoom, onClick }: { entity: MapEntity; zoom: number; onClick: () => void }) {
  const color = getMarkerColor(entity);
  const size = getMarkerSize(entity, zoom);
  const isAnomaly = entity.type === 'anomaly';
  const isFeeder = entity.type === 'feeder';

  return (
    <AdvancedMarker position={{ lat: entity.lat, lng: entity.lng }} onClick={onClick}>
      <div className="relative cursor-pointer group" style={{ width: size * 2, height: size * 2 }}>
        {/* Pulse ring for anomalies */}
        {isAnomaly && (
          <div className="absolute inset-0 rounded-full animate-ping opacity-30" style={{ background: color }} />
        )}
        {/* Main marker */}
        <div
          className={cn(
            'absolute inset-0 flex items-center justify-center transition-transform group-hover:scale-125',
            isFeeder ? 'rounded-sm' : 'rounded-full',
          )}
          style={{
            background: color,
            boxShadow: `0 0 ${isAnomaly ? 12 : 6}px ${color}80`,
            width: size,
            height: size,
            margin: 'auto',
            top: 0, left: 0, right: 0, bottom: 0,
          }}
        >
          {isFeeder && <Zap className="text-[hsl(222,47%,6%)]" style={{ width: size * 0.5, height: size * 0.5 }} />}
          {isAnomaly && <AlertTriangle className="text-[hsl(222,47%,6%)]" style={{ width: size * 0.5, height: size * 0.5 }} />}
        </div>
      </div>
    </AdvancedMarker>
  );
}

import { useRouter } from 'next/navigation';

// Intelligence panel for selected entity
function IntelligencePanel({ entity, onClose }: { entity: MapEntity; onClose: () => void }) {
  const router = useRouter();
  const color = getMarkerColor(entity);
  const Icon = entity.type === 'feeder' ? Zap : entity.type === 'anomaly' ? AlertTriangle : Gauge;

  return (
    <div className="absolute top-4 right-16 z-20 w-80 glass-card rounded-xl overflow-hidden animate-slide-up">
      <div className="p-4 border-b border-white/[0.06]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg" style={{ background: `${color}20` }}>
              <Icon className="h-4 w-4" style={{ color }} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">{entity.label}</h3>
              <p className="text-[10px] text-slate-600 uppercase tracking-wider font-bold">{entity.type}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/[0.04] rounded"><X className="h-4 w-4" /></button>
        </div>
      </div>
      <div className="p-4 space-y-3">
        {/* Risk Score */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-600 font-bold">Risk Score</span>
            <span className="font-bold" style={{ color }}>{(entity.risk * 100).toFixed(0)}%</span>
          </div>
          <div className="h-1.5 bg-black/10 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${entity.risk * 100}%`, background: color }} />
          </div>
        </div>

        {/* Metadata */}
        <div className="space-y-2">
          {Object.entries(entity.metadata).map(([key, value]) => (
            <div key={key} className="flex justify-between text-xs">
              <span className="text-slate-600 font-bold capitalize">{key.replace(/_/g, ' ')}</span>
              <span className="font-bold text-slate-900">{typeof value === 'number' ? (value as number).toFixed(2) : String(value)}</span>
            </div>
          ))}
        </div>

        {/* Status */}
        <div className="flex items-center gap-2 pt-2 border-t border-black/10">
          <span className={cn('h-2 w-2 rounded-full',
            entity.status === 'active' || entity.status === 'healthy' ? 'bg-emerald-500' :
            entity.status === 'new' || entity.status === 'investigating' ? 'bg-amber-500' :
            'bg-red-500'
          )} />
          <span className="text-xs text-slate-900 font-bold capitalize">{entity.status}</span>
        </div>

        {/* Quick actions */}
        <div className="flex gap-2 pt-2">
          <button 
            onClick={() => router.push(`/dashboard/anomalies?id=${entity.id}`)}
            className="flex-1 text-[11px] py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-1 font-bold"
          >
            <Activity className="h-3 w-3" /> View Details <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Fallback SVG map when no Google Maps API key
function SVGFallbackMap({ entities, layer, selectedId, onSelect }: {
  entities: MapEntity[]; layer: string; selectedId: string | null; onSelect: (e: MapEntity | null) => void;
}) {
  const project = (lat: number, lng: number) => {
    const x = ((lng - 77.35) / 0.4) * 1200;
    const y = ((13.1 - lat) / 0.35) * 800;
    return { x: Math.max(0, Math.min(1200, x)), y: Math.max(0, Math.min(800, y)) };
  };

  const filtered = entities.filter(e => {
    if (layer === 'feeders') return e.type === 'feeder';
    if (layer === 'anomalies') return e.type === 'anomaly';
    return true;
  });

  return (
    <svg width="100%" height="100%" viewBox="0 0 1200 800" className="bg-[hsl(222,47%,4%)]">
      {/* Grid lines */}
      {Array.from({ length: 20 }, (_, i) => (
        <line key={`h${i}`} x1={0} y1={i * 40} x2={1200} y2={i * 40} stroke="rgba(255,255,255,0.02)" />
      ))}
      {Array.from({ length: 30 }, (_, i) => (
        <line key={`v${i}`} x1={i * 40} y1={0} x2={i * 40} y2={800} stroke="rgba(255,255,255,0.02)" />
      ))}

      {/* Heatmap layer */}
      {layer === 'heatmap' && filtered.map(e => {
        const { x, y } = project(e.lat, e.lng);
        return <circle key={`heat-${e.id}`} cx={x} cy={y} r={40} fill={e.risk > 0.7 ? 'rgba(239,68,68,0.12)' : e.risk > 0.3 ? 'rgba(245,158,11,0.08)' : 'rgba(34,197,94,0.05)'} />;
      })}

      {/* Feeder connections */}
      {layer !== 'anomalies' && filtered.filter(e => e.type === 'feeder').map((f, i, arr) => {
        const { x, y } = project(f.lat, f.lng);
        const next = arr[(i + 1) % arr.length];
        const { x: nx, y: ny } = project(next.lat, next.lng);
        return <line key={`conn-${f.id}`} x1={x} y1={y} x2={nx} y2={ny} stroke="rgba(0,229,255,0.08)" strokeWidth={1} strokeDasharray="4 4" />;
      })}

      {/* Entity points */}
      {filtered.map(e => {
        const { x, y } = project(e.lat, e.lng);
        const color = getMarkerColor(e);
        const size = e.type === 'feeder' ? 6 : e.type === 'anomaly' ? 5 : 3;
        const isSelected = selectedId === e.id;
        return (
          <g key={e.id} className="cursor-pointer" onClick={() => onSelect(isSelected ? null : e)}>
            {e.type === 'anomaly' && <circle cx={x} cy={y} r={12} fill="rgba(239,68,68,0.15)" className="animate-pulse" />}
            {isSelected && <circle cx={x} cy={y} r={size + 6} fill="none" stroke={color} strokeWidth={1.5} className="animate-pulse" />}
            <circle cx={x} cy={y} r={size} fill={color} stroke={color} strokeWidth={0.5}
              style={{ filter: e.type === 'anomaly' ? `drop-shadow(0 0 4px ${color}99)` : e.type === 'feeder' ? `drop-shadow(0 0 3px ${color}66)` : 'none' }}
            />
            {e.type === 'feeder' && <rect x={x - 4} y={y - 4} width={8} height={8} rx={2} fill={color} fillOpacity={0.8} />}
          </g>
        );
      })}
    </svg>
  );
}

export default function GISMapPage() {
  const { feeders, anomalies } = useAppStore();
  const [entities, setEntities] = useState<MapEntity[]>([]);
  const [layer, setLayer] = useState<'all' | 'feeders' | 'anomalies' | 'heatmap' | 'flow' | 'risk'>('all');
  const [selectedEntity, setSelectedEntity] = useState<MapEntity | null>(null);
  const [zoom, setZoom] = useState(12);
  const [loading, setLoading] = useState(true);
  
  // Phase 9/10/11 states
  const [playbackMode, setPlaybackMode] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [simulating, setSimulating] = useState(false);
  const [simulationEvent, setSimulationEvent] = useState<string | null>(null);

  useEffect(() => {
    fetchMapEntities().then(data => {
      setEntities(data);
      setLoading(false);
    });
  }, []);

  const filteredEntities = useMemo(() => entities.filter(e => {
    if (layer === 'feeders') return e.type === 'feeder';
    if (layer === 'anomalies') return e.type === 'anomaly';
    return true;
  }), [entities, layer]);

  const stats = useMemo(() => ({
    totalMeters: entities.filter(e => e.type === 'meter').length,
    totalFeeders: entities.filter(e => e.type === 'feeder').length,
    activeAnomalies: entities.filter(e => e.type === 'anomaly').length,
    highRisk: entities.filter(e => e.risk > 0.7).length,
  }), [entities]);

  const hasGoogleMaps = !!GOOGLE_MAPS_KEY;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-outfit)]">Smart Grid Intelligence Map</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            BESCOM Bangalore zone — {filteredEntities.length.toLocaleString()} active entities
          </p>
        </div>
        {/* Real-time stats badges */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <select 
              value={simulationEvent || ''} 
              onChange={(e) => {
                if(e.target.value) {
                  setSimulationEvent(e.target.value);
                  setSimulating(true);
                  setTimeout(() => setSimulating(false), 3000);
                } else {
                  setSimulationEvent(null);
                }
              }}
              className="appearance-none bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-wider pl-3 pr-8 py-1.5 rounded-lg focus:outline-none focus:border-red-500"
            >
              <option value="">Simulate Grid Event</option>
              <option value="heatwave">Heatwave Demand Spike</option>
              <option value="transformer_fail">Transformer Failure</option>
              <option value="coordinated_theft">Coordinated Theft Ring</option>
              <option value="communication_outage">Comms Outage</option>
            </select>
            <AlertTriangle className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-red-400" />
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-[11px]">
            <Gauge className="h-3 w-3 text-primary" /> <span className="text-primary font-semibold">{stats.totalMeters}</span> <span className="text-muted-foreground">meters</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-[11px]">
            <Zap className="h-3 w-3 text-emerald-400" /> <span className="text-emerald-400 font-semibold">{stats.totalFeeders}</span> <span className="text-muted-foreground">feeders</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 text-[11px]">
            <AlertTriangle className="h-3 w-3 text-red-400" /> <span className="text-red-400 font-semibold">{stats.activeAnomalies}</span> <span className="text-muted-foreground">anomalies</span>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-xl overflow-hidden relative" style={{ height: '72vh' }}>
          {/* Advanced Map Layer Controls */}
          <div className="absolute top-6 left-6 z-10 glass-card p-2 rounded-xl flex flex-col gap-1.5">
            <div className="p-2 border-b border-white/[0.06] mb-1">
              <Layers className="h-4 w-4 text-muted-foreground" />
            </div>
            {[
              { id: 'all', label: 'All Entities' },
              { id: 'feeders', label: 'Feeder Routes' },
              { id: 'anomalies', label: 'Anomaly Density' },
              { id: 'heatmap', label: 'Risk Heatmap' },
              { id: 'flow', label: 'Animated Power Flow' },
              { id: 'risk', label: 'Risk Propagation' },
            ].map(l => (
              <button key={l.id} onClick={() => setLayer(l.id as any)}
                className={cn('px-3 py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-colors text-left',
                  layer === l.id ? 'bg-primary/20 text-primary border border-primary/30' : 'text-slate-900 hover:bg-black/10 border border-transparent'
                )}>
                {l.label}
              </button>
            ))}
          </div>

          {/* Timeline Playback Mode UI */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 glass-card p-4 rounded-xl w-[500px] flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setPlaybackMode(!playbackMode)}
                  className={cn("px-3 py-1 rounded text-[10px] font-bold uppercase border transition-colors", playbackMode ? 'bg-primary text-primary-foreground border-primary shadow-[0_0_10px_rgba(0,229,255,0.4)]' : 'bg-white/[0.04] text-muted-foreground border-white/[0.1]')}
                >
                  {playbackMode ? 'Stop Playback' : 'Timeline Playback'}
                </button>
                <span className="text-[10px] font-mono text-slate-900 ml-2 font-bold">
                  {new Date(Date.now() - (100 - playbackTime) * 3600000).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <span className="text-[10px] uppercase text-primary font-bold">Historical Mode</span>
            </div>
            {playbackMode && (
              <div className="flex items-center gap-3">
                <span className="text-[9px] text-muted-foreground uppercase">-100h</span>
                <input 
                  type="range" min="0" max="100" value={playbackTime} 
                  onChange={(e) => setPlaybackTime(parseInt(e.target.value))}
                  className="flex-1 accent-primary h-1 bg-white/[1] rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-[9px] text-muted-foreground uppercase">Now</span>
              </div>
            )}
          </div>

          {/* Warning Banner during simulation */}
          {simulating && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 bg-red-500/20 border border-red-500/40 text-red-400 px-6 py-2 rounded-full font-bold uppercase tracking-widest text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-pulse">
              <AlertTriangle className="h-4 w-4" /> Injecting National Scale Simulation Event: {simulationEvent?.replace(/_/g, ' ')}...
            </div>
          )}

          {selectedEntity && <IntelligencePanel entity={selectedEntity} onClose={() => setSelectedEntity(null)} />}

        {/* Zoom Controls */}
        <div className="absolute top-4 right-4 z-10 glass rounded-lg p-1 flex flex-col gap-1">
          <button onClick={() => setZoom(z => Math.min(z + 1, 18))} className="p-2 hover:bg-white/[0.04] rounded"><ZoomIn className="h-4 w-4" /></button>
          <button onClick={() => setZoom(z => Math.max(z - 1, 8))} className="p-2 hover:bg-white/[0.04] rounded"><ZoomOut className="h-4 w-4" /></button>
          <button onClick={() => setZoom(12)} className="p-2 hover:bg-white/[0.04] rounded"><Crosshair className="h-4 w-4" /></button>
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 z-10 glass rounded-lg p-3 border border-black/10">
          <p className="text-[10px] uppercase tracking-wider text-slate-900 font-bold mb-2">Legend</p>
          <div className="space-y-1.5 font-bold text-slate-900">
            <div className="flex items-center gap-2 text-[11px]"><span className="h-3 w-3 rounded-full bg-emerald-500" /> Healthy Meter</div>
            <div className="flex items-center gap-2 text-[11px]"><span className="h-3 w-3 rounded-full bg-amber-500" /> Warning</div>
            <div className="flex items-center gap-2 text-[11px]"><span className="h-3 w-3 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]" /> Anomaly</div>
            <div className="flex items-center gap-2 text-[11px]"><span className="h-3 w-3 rounded bg-primary" /> Feeder</div>
          </div>
        </div>

        {/* Stats Overlay */}
        <div className="absolute bottom-4 right-4 z-10 glass rounded-lg p-3 text-right border border-black/10">
          <p className="text-[10px] uppercase tracking-wider text-slate-900 font-bold mb-1">Zone Summary</p>
          <p className="text-xs text-slate-900 font-bold"><span className="text-emerald-600">{stats.totalFeeders}</span> feeders</p>
          <p className="text-xs text-slate-900 font-bold"><span className="text-red-600">{stats.activeAnomalies}</span> active anomalies</p>
          <p className="text-xs text-slate-900 font-bold"><span className="text-amber-600">{stats.highRisk}</span> high risk</p>
          <p className="text-[10px] text-slate-500 mt-1 font-bold">Zoom: {zoom}x</p>
        </div>

        {/* Selected Entity Intelligence Panel */}
        {selectedEntity && (
          <IntelligencePanel entity={selectedEntity} onClose={() => setSelectedEntity(null)} />
        )}

        {/* Loading */}
        {loading && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-background/80">
            <div className="text-center">
              <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-muted-foreground">Loading grid intelligence...</p>
            </div>
          </div>
        )}

        {/* Map Render */}
        {hasGoogleMaps ? (
          <APIProvider apiKey={GOOGLE_MAPS_KEY}>
            <Map
              defaultCenter={BANGALORE_CENTER}
              defaultZoom={zoom}
              mapId="vidyut-grid-map"
              styles={DARK_MAP_STYLE}
              disableDefaultUI
              gestureHandling="greedy"
              className="w-full h-full"
              onZoomChanged={(e) => {
                const z = e.detail?.zoom;
                if (z) setZoom(z);
              }}
            >
              {filteredEntities.map(entity => (
                <EntityMarker
                  key={entity.id}
                  entity={entity}
                  zoom={zoom}
                  onClick={() => setSelectedEntity(entity)}
                />
              ))}
            </Map>
          </APIProvider>
        ) : (
          <SVGFallbackMap
            entities={entities}
            layer={layer}
            selectedId={selectedEntity?.id || null}
            onSelect={setSelectedEntity}
          />
        )}
      </div>
    </div>
  );
}
