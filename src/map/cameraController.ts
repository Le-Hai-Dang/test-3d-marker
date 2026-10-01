import maplibregl from 'maplibre-gl';
import type { LogisticsLocation } from '../data/logisticsLocation';

export type CameraPreset = 'top' | 'isometric' | 'front' | 'right' | 'back' | 'left';

export interface CameraPose {
  zoom: number;
  pitch: number;
  bearing: number;
  duration?: number;
}

export const CAMERA_PRESETS: Record<CameraPreset, CameraPose> = {
  top: {
    zoom: 17.0,
    pitch: 5,
    bearing: 0,
    duration: 1500
  },
  isometric: {
    zoom: 17.5,
    pitch: 60,
    bearing: -35,
    duration: 1600
  },
  front: {
    zoom: 18.0,
    pitch: 72,
    bearing: 0,
    duration: 1600
  },
  right: {
    zoom: 18.0,
    pitch: 72,
    bearing: 90,
    duration: 1600
  },
  back: {
    zoom: 18.0,
    pitch: 72,
    bearing: 180,
    duration: 1600
  },
  left: {
    zoom: 18.0,
    pitch: 72,
    bearing: -90,
    duration: 1600
  }
};

export class CameraController {
  private map: maplibregl.Map;

  constructor(map: maplibregl.Map) {
    this.map = map;
  }

  public focusLocation(
    location: LogisticsLocation,
    options: {
      zoom?: number;
      pitch?: number;
      bearing?: number;
      paddingRight?: number;
      duration?: number;
    } = {}
  ): void {
    const padding = options.paddingRight
      ? { top: 0, bottom: 0, left: 0, right: options.paddingRight }
      : { top: 0, bottom: 0, left: 0, right: 0 };

    this.map.easeTo({
      center: [location.longitude, location.latitude],
      zoom: options.zoom ?? this.map.getZoom(),
      pitch: options.pitch ?? this.map.getPitch(),
      bearing: options.bearing ?? this.map.getBearing(),
      padding,
      duration: options.duration ?? 1500,
      essential: true
    });
  }

  public goToPreset(
    preset: CameraPreset,
    location: LogisticsLocation,
    paddingRight = 0
  ): void {
    const config = CAMERA_PRESETS[preset];
    if (!config) return;

    this.focusLocation(location, {
      zoom: config.zoom,
      pitch: config.pitch,
      bearing: config.bearing,
      duration: config.duration,
      paddingRight
    });
  }

  public getEstimatedCameraAltitudeMeters(): number {
    const zoom = this.map.getZoom();
    const pitch = this.map.getPitch();
    // At zoom 17.5 in HCMC (~10.77 deg lat), base ground distance is ~90m
    const baseDistanceMeters = 591657550.5 / Math.pow(2, zoom + 8);
    const altitudeMeters = baseDistanceMeters * Math.cos((pitch * Math.PI) / 180);
    return Math.max(15, Math.round(altitudeMeters));
  }

  public getCurrentTelemetry(): {
    zoom: number;
    pitch: number;
    bearing: number;
    altitudeMeters: number;
    center: [number, number];
  } {
    const center = this.map.getCenter();
    return {
      zoom: Math.round(this.map.getZoom() * 10) / 10,
      pitch: Math.round(this.map.getPitch()),
      bearing: Math.round(this.map.getBearing()),
      altitudeMeters: this.getEstimatedCameraAltitudeMeters(),
      center: [
        Math.round(center.lng * 10000) / 10000,
        Math.round(center.lat * 10000) / 10000
      ]
    };
  }
}
