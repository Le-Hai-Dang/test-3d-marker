import './styles/global.css';
import './styles/hud.css';
import './styles/panels.css';

import * as THREE from 'three';
import { createMap } from './map/createMap';
import { CameraController } from './map/cameraController';
import { Logistics3DLayer } from './three/Logistics3DLayer';
import { DEMO_LOCATION } from './data/logisticsLocation';
import { DEMO_GEOFENCE } from './data/demoRoute';
import { Hud } from './ui/Hud';
import { Tooltip } from './ui/Tooltip';
import { InfoPanel } from './ui/InfoPanel';
import { CameraControls } from './ui/CameraControls';
import { LoadingScreen } from './ui/LoadingScreen';
import { DebugPanel } from './ui/DebugPanel';
import { RaycastController } from './interaction/RaycastController';
import { SelectionController } from './interaction/SelectionController';
import { InspectController, CameraMode } from './interaction/InspectController';
import { IntroSequence } from './animation/IntroSequence';
import { OrbitController } from './animation/OrbitController';
import { PerformanceMonitor } from './utils/performance';

async function bootstrap() {
  const appContainer = document.getElementById('app')!;
  const urlParams = new URLSearchParams(window.location.search);
  const isDebug = urlParams.get('debug') === '1';

  // 1. Initialize Loading Screen
  const loadingScreen = new LoadingScreen();
  loadingScreen.setProgress(15, 'Initializing geospatial environment...');

  const perfMonitor = new PerformanceMonitor();

  // 2. Initialize MapLibre
  const map = createMap({
    onLoad: () => {
      loadingScreen.setProgress(35, 'Mounting GIS context layers...');
      setupGisLayers();
      setup3DLayer();
    },
    onError: (err) => {
      console.error('Map initialization error:', err);
      loadingScreen.showError('Map Initialization Error', err.message);
    }
  });

  // Setup surrounding GeoJSON layers (route corridor + logistics geofence)
  function setupGisLayers() {
    // Geofence boundary
    map.addSource('geofence-source', {
      type: 'geojson',
      data: DEMO_GEOFENCE
    });

    map.addLayer({
      id: 'geofence-fill',
      type: 'fill',
      source: 'geofence-source',
      paint: {
        'fill-color': '#38bdf8',
        'fill-opacity': 0.05
      }
    });

    map.addLayer({
      id: 'geofence-line',
      type: 'line',
      source: 'geofence-source',
      paint: {
        'line-color': '#38bdf8',
        'line-width': 1.5,
        'line-dasharray': [3, 2],
        'line-opacity': 0.65
      }
    });
  }

  // Setup Three.js 3D Custom Layer
  function setup3DLayer() {
    const logisticsLayer = new Logistics3DLayer(DEMO_LOCATION, {
      onProgress: (percent) => {
        const overall = 35 + Math.round((percent / 100) * 60);
        loadingScreen.setProgress(overall, 'Loading container yard 3D model...');
      },
      onModelLoaded: () => {
        loadingScreen.setProgress(100, 'Operations environment ready');
        setTimeout(() => {
          loadingScreen.hide();
          initInteractionAndCinematic(logisticsLayer);
        }, 500);
      },
      onModelLoadError: (err) => {
        console.error('Model load failure:', err);
        loadingScreen.showError(
          '3D MODEL UNAVAILABLE',
          `Unable to load: ${DEMO_LOCATION.modelUrl}. Check console for details.`
        );
      }
    });

    map.addLayer(logisticsLayer);
  }

  function initInteractionAndCinematic(layer: Logistics3DLayer) {
    // 1. HUD & Info Components
    const hud = new Hud(appContainer);
    const tooltip = new Tooltip(appContainer);
    tooltip.setContent(DEMO_LOCATION);

    const cameraController = new CameraController(map);

    const infoPanel = new InfoPanel(appContainer, DEMO_LOCATION, {
      onCenterCamera: () => {
        cameraController.focusLocation(DEMO_LOCATION, {
          zoom: 17.5,
          pitch: 62,
          bearing: -35,
          paddingRight: window.innerWidth <= 768 ? 0 : 360,
          duration: 1600
        });
        hud.showToast('Camera centered on Container Hub');
      },
      onViewDetails: () => {
        hud.showToast('Facility telemetry updated');
      }
    });

    // 2. Orbit controller (manual trigger only, default OFF)
    let cameraControls: CameraControls;
    const orbitController = new OrbitController(map, DEMO_LOCATION, (active) => {
      cameraControls?.setOrbitActive(active);
    });

    // 3. 3D Camera & Inspect Controller
    const inspectController = new InspectController(map, DEMO_LOCATION, {
      onModeChange: (mode) => {
        hud.setMode(mode);
        cameraControls?.setInspectActive(mode === CameraMode.INSPECT);
        if (mode === CameraMode.INSPECT) {
          orbitController.stop();
        }
      },
      onTelemetryUpdate: () => {
        updateTelemetry();
      },
      onInterruptIntro: () => {
        introSequence.interrupt();
        orbitController.stop();
        inspectController.setMode(CameraMode.MAP);
      }
    });

    // 4. Selection & Raycasting
    const selectionController = new SelectionController(
      DEMO_LOCATION,
      layer,
      cameraController,
      infoPanel
    );

    new RaycastController(map, layer, {
      onHoverChange: (isHovered, x, y) => {
        if (isHovered) {
          tooltip.show(x, y);
        } else {
          tooltip.hide();
        }
      },
      onModelClick: () => {
        selectionController.select();
        inspectController.enter();
      },
      onMapClick: () => {
        selectionController.deselect();
      }
    });

    // 5. Camera Toolbar Controls
    cameraControls = new CameraControls(appContainer, {
      onToggleInspect: () => {
        orbitController.stop();
        inspectController.toggle();
      },
      onAdjustAltitude: (delta) => {
        orbitController.stop();
        inspectController.adjustAltitude(delta);
      },
      onPreset: (preset) => {
        orbitController.stop();
        inspectController.setMode(CameraMode.MAP);
        const paddingRight = selectionController.getIsSelected() && window.innerWidth > 768 ? 360 : 0;
        cameraController.goToPreset(preset, DEMO_LOCATION, paddingRight);
      },
      onToggleOrbit: () => {
        if (inspectController.getIsInspect()) {
          inspectController.exit();
        }
        orbitController.toggle();
      },
      onReset: () => {
        orbitController.stop();
        inspectController.exit();
        const paddingRight = selectionController.getIsSelected() && window.innerWidth > 768 ? 360 : 0;
        cameraController.goToPreset('isometric', DEMO_LOCATION, paddingRight);
      }
    });

    const introSequence = new IntroSequence(map, DEMO_LOCATION);

    // 6. Debug Panel if ?debug=1
    if (isDebug) {
      new DebugPanel(
        appContainer,
        map,
        layer,
        DEMO_LOCATION,
        perfMonitor,
        cameraController,
        inspectController,
        orbitController
      );
    }

    // 7. Telemetry update loop on map movement
    const updateTelemetry = () => {
      hud.updateTelemetry(
        map.getZoom(),
        map.getPitch(),
        map.getBearing(),
        cameraController.getEstimatedCameraAltitudeMeters()
      );
      perfMonitor.tick();
    };

    map.on('move', updateTelemetry);
    map.on('zoom', updateTelemetry);
    map.on('pitch', updateTelemetry);
    map.on('rotate', updateTelemetry);
    updateTelemetry();

    // 8. Play cinematic entry sequence (NO AUTO ORBIT AFTER INTRO)
    setTimeout(() => {
      introSequence.play(() => {
        hud.showToast('Logistics Operations Hub Online');
        inspectController.setMode(CameraMode.MAP);
        // Crucial requirement: camera stops completely, NO auto-orbit!
      });
    }, 400);

    // 9. Expose references for automated testing & verification
    (window as any).THREE = THREE;
    (window as any).__app = {
      map,
      layer,
      selectionController,
      cameraController,
      inspectController,
      orbitController,
      infoPanel,
      hud,
      CameraMode
    };
  }
}

// Start application
bootstrap().catch((err) => {
  console.error('Fatal initialization error:', err);
});
