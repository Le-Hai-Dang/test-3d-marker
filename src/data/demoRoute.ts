import type { Feature, LineString, Polygon } from 'geojson';

// Logistics approach route arriving at the container yard
export const DEMO_ROUTE: Feature<LineString> = {
  type: 'Feature',
  properties: {
    name: 'Primary Inbound Logistics Corridor',
    id: 'corridor-inbound-01'
  },
  geometry: {
    type: 'LineString',
    coordinates: [
      [106.6965, 10.7735],
      [106.6980, 10.7745],
      [106.6995, 10.7758],
      [106.7004, 10.7764],
      [106.7009, 10.7769] // Hub destination
    ]
  }
};

// Perimeter geofence around the container yard operations area (aligned to street block)
export const DEMO_GEOFENCE: Feature<Polygon> = {
  type: 'Feature',
  properties: {
    name: 'LOGISTICS OPERATION ZONE A',
    type: 'RESTRICTED_PORT_FACILITY'
  },
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        [106.700266, 10.777029],
        [106.701093, 10.777511],
        [106.701534, 10.776771],
        [106.700707, 10.776289],
        [106.700266, 10.777029]
      ]
    ]
  }
};
