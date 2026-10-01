import maplibregl from 'maplibre-gl';
import { OPENFREEMAP_DARK_URL, ESRI_DARK_GRAY_STYLE } from './mapStyle';
import { DEMO_LOCATION } from '../data/logisticsLocation';

export interface MapInitOptions {
  containerId?: string;
  onLoad?: (map: maplibregl.Map) => void;
  onError?: (error: Error) => void;
}

export function createMap(options: MapInitOptions = {}): maplibregl.Map {
  const container = options.containerId || 'map';

  const map = new maplibregl.Map({
    container,
    style: OPENFREEMAP_DARK_URL,
    center: [DEMO_LOCATION.longitude, DEMO_LOCATION.latitude],
    zoom: 14.8,
    pitch: 28,
    bearing: -15,
    minPitch: 0,
    maxPitch: 82,
    minZoom: 14,
    maxZoom: 20.5,
    interactive: true,
    dragPan: true,
    dragRotate: false, // Handled cleanly by custom model-anchored 3D controller
    pitchWithRotate: false,
    scrollZoom: true,
    touchZoomRotate: true,
    touchPitch: true,
    keyboard: true,
    doubleClickZoom: true,
    attributionControl: false,
    antialias: true
  });

  // Ensure touch handlers are active for mobile gestures
  map.touchZoomRotate.enable();
  map.touchPitch.enable();

  // Custom compact navigation control
  const nav = new maplibregl.NavigationControl({
    visualizePitch: true,
    showCompass: true,
    showZoom: true
  });
  map.addControl(nav, 'bottom-right');

  // Attribution in custom unobtrusive position
  map.addControl(
    new maplibregl.AttributionControl({
      compact: true
    }),
    'top-right'
  );

  // Fallback handler if style load fails
  let styleFailed = false;
  map.on('error', (e) => {
    if (!styleFailed && e.error && e.error.message && (e.error.message.includes('style') || e.error.message.includes('401') || e.error.message.includes('403'))) {
      console.warn('Primary vector map style failed, falling back to backup ESRI Dark Gray style...', e.error);
      styleFailed = true;
      map.setStyle(ESRI_DARK_GRAY_STYLE);
    }
  });

  if (options.onLoad) {
    map.once('load', () => options.onLoad!(map));
  }

  return map;
}
