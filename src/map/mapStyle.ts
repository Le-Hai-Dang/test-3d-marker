import type { StyleSpecification } from 'maplibre-gl';

// High-performance OpenFreeMap Vector Dark Style URL (no API key, free, fast)
export const OPENFREEMAP_DARK_URL = 'https://tiles.openfreemap.org/styles/dark';

// ESRI World Dark Gray Canvas style specification (free public GIS raster, zero watermark)
export const ESRI_DARK_GRAY_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    'esri-dark-gray-base': {
      type: 'raster',
      tiles: [
        'https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'
      ],
      tileSize: 256,
      maxzoom: 16,
      attribution:
        'Esri, HERE, Garmin, &copy; OpenStreetMap contributors, and the GIS user community'
    },
    'esri-dark-gray-ref': {
      type: 'raster',
      tiles: [
        'https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}'
      ],
      tileSize: 256,
      maxzoom: 16,
      attribution: ''
    }
  },
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: {
        'background-color': '#11141c'
      }
    },
    {
      id: 'esri-base-layer',
      type: 'raster',
      source: 'esri-dark-gray-base',
      minzoom: 0,
      maxzoom: 22,
      paint: {
        'raster-opacity': 0.95,
        'raster-contrast': 0.15
      }
    },
    {
      id: 'esri-ref-layer',
      type: 'raster',
      source: 'esri-dark-gray-ref',
      minzoom: 0,
      maxzoom: 22,
      paint: {
        'raster-opacity': 0.7
      }
    }
  ]
};

// Fallback style using Carto Dark raster or OSM inverted
export const BACKUP_STYLE: StyleSpecification = ESRI_DARK_GRAY_STYLE;
