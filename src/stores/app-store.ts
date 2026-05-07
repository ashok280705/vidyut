'use client';
import { create } from 'zustand';
import type { DashboardStats, Anomaly, Feeder, Inspection, ActivityItem, WeatherData } from '@/types';
import * as svc from '@/services/supabase-services';

interface AppStore {
  initialized: boolean;
  init: () => void;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  // Live data from Supabase
  stats: DashboardStats | null;
  anomalies: Anomaly[];
  feeders: Feeder[];
  inspections: Inspection[];
  activity: ActivityItem[];
  weather: WeatherData | null;

  // Refresh from database
  refreshData: () => void;
  refreshAnomalies: () => void;
  refreshInspections: () => void;

  // UI state
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  notifications: ActivityItem[];
  notificationsPanelOpen: boolean;
  setNotificationsPanelOpen: (open: boolean) => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
  initialized: false,
  init: () => {
    if (get().initialized) return;
    set({ initialized: true });
    // Fetch all data from Supabase in parallel
    Promise.all([
      svc.fetchDashboardStats(),
      svc.fetchAnomalies({ limit: 50 }),
      svc.fetchFeeders(),
      svc.fetchInspections(),
      svc.fetchActivity(20),
      svc.fetchWeather(),
      svc.fetchNotifications(),
    ]).then(([stats, anomalies, feeders, inspections, activity, weather, notifications]) => {
      set({ stats, anomalies, feeders, inspections, activity, weather, notifications });
    });
  },

  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  stats: null,
  anomalies: [],
  feeders: [],
  inspections: [],
  activity: [],
  weather: null,

  refreshData: () => {
    Promise.all([
      svc.fetchDashboardStats(),
      svc.fetchActivity(20),
      svc.fetchWeather(),
    ]).then(([stats, activity, weather]) => {
      set({ stats, activity, weather });
    });
  },

  refreshAnomalies: () => {
    svc.fetchAnomalies({ limit: 50 }).then(anomalies => set({ anomalies }));
  },

  refreshInspections: () => {
    svc.fetchInspections().then(inspections => set({ inspections }));
  },

  commandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  notifications: [],
  notificationsPanelOpen: false,
  setNotificationsPanelOpen: (open) => set({ notificationsPanelOpen: open }),
}));
