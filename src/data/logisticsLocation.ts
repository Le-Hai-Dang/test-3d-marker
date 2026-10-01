export interface LogisticsMetrics {
  containers: number;
  vehiclesProcessing: number;
  capacityPercent: number;
  loadingZones: number;
  averageProcessingMinutes: number;
  lastUpdated: string;
}

export interface ActivityItem {
  time: string;
  text: string;
}

export interface LogisticsLocation {
  id: string;
  name: string;
  subtitle: string;
  longitude: number;
  latitude: number;
  altitude: number;
  headingDegrees: number;
  targetWidthMeters: number;
  modelUrl: string;
  status: 'ACTIVE' | 'STANDBY' | 'MAINTENANCE';
  metrics: LogisticsMetrics;
  activities: ActivityItem[];
}

export const DEMO_LOCATION: LogisticsLocation = {
  id: 'container-yard-001',
  name: 'Container Logistics Hub',
  subtitle: '3D Operational Site',
  longitude: 106.7009,
  latitude: 10.7769,
  altitude: 0,
  headingDegrees: 59.5,
  targetWidthMeters: 80,
  modelUrl: '/models/container-yard.glb',
  status: 'ACTIVE',
  metrics: {
    containers: 128,
    vehiclesProcessing: 12,
    capacityPercent: 78,
    loadingZones: 4,
    averageProcessingMinutes: 24,
    lastUpdated: 'Just now'
  },
  activities: [
    { time: '10:42', text: 'Truck VN-51C-8921 entered loading zone A' },
    { time: '10:38', text: '40ft HC container unloaded from bay 03' },
    { time: '10:31', text: 'Vehicle VN-50LD-1102 departed through Gate 2' },
    { time: '10:24', text: 'Automated reefer temperature check completed' }
  ]
};
