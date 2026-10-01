import maplibregl from 'maplibre-gl';
import type { LogisticsLocation } from '../data/logisticsLocation';

export enum CameraMode {
  INTRO = 'INTRO',
  MAP = 'MAP',
  INSPECT = 'INSPECT'
}

export interface InspectControllerCallbacks {
  onModeChange: (mode: CameraMode) => void;
  onTelemetryUpdate?: () => void;
  onInterruptIntro?: () => void;
}

export class InspectController {
  private map: maplibregl.Map;
  private location: LogisticsLocation;
  private callbacks: InspectControllerCallbacks;
  private mode: CameraMode = CameraMode.INTRO;
  private isDragging = false;
  private startX = 0;
  private startY = 0;
  private startBearing = 0;
  private startPitch = 0;

  // Exact sensitivities requested: Rotate 0.3, Pitch 0.2
  private readonly ROTATE_SENSITIVITY = 0.3; // degrees per pixel
  private readonly PITCH_SENSITIVITY = 0.2;  // degrees per pixel
  private readonly MIN_PITCH = 10;           // degrees (near top-down)
  private readonly MAX_PITCH = 82;           // degrees (near ground-level)
  private readonly MIN_ZOOM = 14.2;
  private readonly MAX_ZOOM = 19.5;

  constructor(map: maplibregl.Map, location: LogisticsLocation, callbacks: InspectControllerCallbacks) {
    this.map = map;
    this.location = location;
    this.callbacks = callbacks;

    this.bindEvents();
  }

  private bindEvents(): void {
    const canvas = this.map.getCanvas();

    // Disable browser context menu on map canvas so right-drag orbit works uninterrupted
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // Mouse events for 3D Orbit & Tilt (both Map Mode right-drag and Inspect Mode left/right-drag)
    canvas.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('mouseup', this.handleMouseUp);

    // Centered wheel zoom
    canvas.addEventListener('wheel', this.handleWheel, { passive: false });

    // Keyboard shortcuts (PageUp/Down for altitude, ESC to exit inspect)
    window.addEventListener('keydown', this.handleKeyDown);

    // Mobile touch controls
    canvas.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', this.handleTouchEnd);
  }

  public getMode(): CameraMode {
    return this.mode;
  }

  public getIsInspect(): boolean {
    return this.mode === CameraMode.INSPECT;
  }

  public getIsDragging(): boolean {
    return this.isDragging;
  }

  public setMode(newMode: CameraMode): void {
    if (this.mode === newMode) return;
    this.mode = newMode;

    if (newMode === CameraMode.INSPECT) {
      // Disable map panning so left-drag orbits the 3D model
      this.map.dragPan.disable();
      this.map.getContainer().classList.add('inspect-mode');

      // Smoothly align camera onto model at 60° pitch
      this.map.easeTo({
        center: [this.location.longitude, this.location.latitude],
        zoom: Math.max(17.5, Math.min(18.5, this.map.getZoom())),
        pitch: 60,
        duration: 1200,
        essential: true
      });
    } else {
      // Restore map pan in MAP mode
      this.map.dragPan.enable();
      this.map.getContainer().classList.remove('inspect-mode', 'dragging');
      this.isDragging = false;
    }

    this.callbacks.onModeChange(this.mode);
  }

  public toggle(): boolean {
    if (this.mode === CameraMode.INSPECT) {
      this.exit();
    } else {
      this.enter();
    }
    return this.mode === CameraMode.INSPECT;
  }

  public enter(): void {
    this.setMode(CameraMode.INSPECT);
  }

  public exit(): void {
    this.setMode(CameraMode.MAP);
  }

  // Camera Altitude adjustments (Dolly in / out along viewing axis)
  public adjustAltitude(deltaMeters: number): void {
    const zoomStep = deltaMeters > 0 ? -0.35 : 0.35;
    const currentZoom = this.map.getZoom();
    const newZoom = Math.max(this.MIN_ZOOM, Math.min(this.MAX_ZOOM, currentZoom + zoomStep));

    this.map.easeTo({
      center: [this.location.longitude, this.location.latitude],
      zoom: newZoom,
      duration: 400
    });
  }

  private handleMouseDown = (e: MouseEvent): void => {
    // If intro animation is still active, any interaction cancels it immediately
    if (this.mode === CameraMode.INTRO) {
      if (this.callbacks.onInterruptIntro) {
        this.callbacks.onInterruptIntro();
      }
      this.mode = CameraMode.MAP;
    }

    if (this.mode === CameraMode.MAP) {
      // In MAP mode: Right-click (2) or Ctrl + Left-click (0) orbits the 3D model
      if (e.button === 2 || (e.button === 0 && e.ctrlKey)) {
        this.isDragging = true;
        this.startX = e.clientX;
        this.startY = e.clientY;
        this.startBearing = this.map.getBearing();
        this.startPitch = this.map.getPitch();
        this.map.getContainer().classList.add('dragging');
        e.preventDefault();
      }
      // Normal left click without Ctrl is handled by MapLibre native dragPan
      return;
    }

    if (this.mode === CameraMode.INSPECT) {
      // In INSPECT mode: Both Left-click (0) and Right-click (2) orbit the model
      if (e.button === 0 || e.button === 2) {
        this.isDragging = true;
        this.startX = e.clientX;
        this.startY = e.clientY;
        this.startBearing = this.map.getBearing();
        this.startPitch = this.map.getPitch();
        this.map.getContainer().classList.add('dragging');
        e.preventDefault();
      }
    }
  };

  private handleMouseMove = (e: MouseEvent): void => {
    if (!this.isDragging) return;

    const deltaX = e.clientX - this.startX;
    const deltaY = e.clientY - this.startY;

    // Horizontal drag: drag right -> bearing increases; drag left -> bearing decreases
    const nextBearing = (this.startBearing + deltaX * this.ROTATE_SENSITIVITY) % 360;

    // Vertical drag: drag up -> lower view angle towards ground (pitch increases)
    // drag down -> raise view angle looking from top (pitch decreases)
    const nextPitch = Math.max(
      this.MIN_PITCH,
      Math.min(this.MAX_PITCH, this.startPitch - deltaY * this.PITCH_SENSITIVITY)
    );

    // Immediate real-time matrix update locked around the model center
    this.map.jumpTo({
      center: [this.location.longitude, this.location.latitude],
      bearing: nextBearing,
      pitch: nextPitch,
      zoom: this.map.getZoom()
    });

    if (this.callbacks.onTelemetryUpdate) {
      this.callbacks.onTelemetryUpdate();
    }
  };

  private handleMouseUp = (): void => {
    if (this.isDragging) {
      this.isDragging = false;
      this.map.getContainer().classList.remove('dragging');
    }
  };

  private handleWheel = (e: WheelEvent): void => {
    if (this.mode === CameraMode.INTRO) {
      if (this.callbacks.onInterruptIntro) {
        this.callbacks.onInterruptIntro();
      }
      this.mode = CameraMode.MAP;
    }

    if (this.mode === CameraMode.INSPECT) {
      e.preventDefault();

      // Scroll zoom centered directly on the 3D model
      const delta = e.deltaY;
      const currentZoom = this.map.getZoom();
      const zoomDelta = -delta * 0.0025;
      const newZoom = Math.max(this.MIN_ZOOM, Math.min(this.MAX_ZOOM, currentZoom + zoomDelta));

      this.map.jumpTo({
        center: [this.location.longitude, this.location.latitude],
        zoom: newZoom
      });

      if (this.callbacks.onTelemetryUpdate) {
        this.callbacks.onTelemetryUpdate();
      }
    }
    // In MAP mode, MapLibre native scroll zoom handles zooming
  };

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (this.mode === CameraMode.INTRO) {
      if (this.callbacks.onInterruptIntro) {
        this.callbacks.onInterruptIntro();
      }
      this.mode = CameraMode.MAP;
    }

    if (e.key === 'Escape' && this.mode === CameraMode.INSPECT) {
      this.exit();
      return;
    }

    if (this.mode === CameraMode.INSPECT) {
      if (e.key === 'PageUp') {
        e.preventDefault();
        this.adjustAltitude(30); // Raise camera
      } else if (e.key === 'PageDown') {
        e.preventDefault();
        this.adjustAltitude(-30); // Lower camera
      }
    }
  };

  // Mobile Touch handling
  private touchStartPos = { x: 0, y: 0 };
  private touchStartDist = 0;

  private handleTouchStart = (e: TouchEvent): void => {
    if (this.mode === CameraMode.INTRO) {
      if (this.callbacks.onInterruptIntro) {
        this.callbacks.onInterruptIntro();
      }
      this.mode = CameraMode.MAP;
    }

    if (this.mode !== CameraMode.INSPECT) return;

    if (e.touches.length === 1) {
      this.isDragging = true;
      this.touchStartPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      this.startBearing = this.map.getBearing();
      this.startPitch = this.map.getPitch();
    } else if (e.touches.length === 2) {
      this.isDragging = false;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      this.touchStartDist = Math.hypot(dx, dy);
    }
  };

  private handleTouchMove = (e: TouchEvent): void => {
    if (this.mode !== CameraMode.INSPECT) return;
    e.preventDefault();

    if (e.touches.length === 1 && this.isDragging) {
      const deltaX = e.touches[0].clientX - this.touchStartPos.x;
      const deltaY = e.touches[0].clientY - this.touchStartPos.y;

      const nextBearing = (this.startBearing + deltaX * this.ROTATE_SENSITIVITY) % 360;
      const nextPitch = Math.max(
        this.MIN_PITCH,
        Math.min(this.MAX_PITCH, this.startPitch - deltaY * this.PITCH_SENSITIVITY)
      );

      this.map.jumpTo({
        center: [this.location.longitude, this.location.latitude],
        bearing: nextBearing,
        pitch: nextPitch,
        zoom: this.map.getZoom()
      });
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const pinchDelta = (dist - this.touchStartDist) * 0.01;
      this.touchStartDist = dist;

      const currentZoom = this.map.getZoom();
      const newZoom = Math.max(this.MIN_ZOOM, Math.min(this.MAX_ZOOM, currentZoom + pinchDelta));

      this.map.jumpTo({
        center: [this.location.longitude, this.location.latitude],
        zoom: newZoom
      });
    }
  };

  private handleTouchEnd = (): void => {
    this.isDragging = false;
  };

  public destroy(): void {
    const canvas = this.map.getCanvas();
    canvas.removeEventListener('mousedown', this.handleMouseDown);
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('mouseup', this.handleMouseUp);
    canvas.removeEventListener('wheel', this.handleWheel);
    window.removeEventListener('keydown', this.handleKeyDown);
    canvas.removeEventListener('touchstart', this.handleTouchStart);
    canvas.removeEventListener('touchmove', this.handleTouchMove);
    canvas.removeEventListener('touchend', this.handleTouchEnd);
  }
}
