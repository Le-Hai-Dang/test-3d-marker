import maplibregl from 'maplibre-gl';
import type { LogisticsLocation } from '../data/logisticsLocation';
import type { Logistics3DLayer } from '../three/Logistics3DLayer';
import type { CameraController } from '../map/cameraController';
import type { InspectController } from '../interaction/InspectController';
import type { OrbitController } from '../animation/OrbitController';
import { PerformanceMonitor } from '../utils/performance';

export class DebugPanel {
  private el: HTMLElement;
  private perfMonitor: PerformanceMonitor;
  private map: maplibregl.Map;
  private layer: Logistics3DLayer;
  private location: LogisticsLocation;
  private cameraController: CameraController;
  private inspectController: InspectController;
  private orbitController: OrbitController;
  private updateTimer: number | null = null;

  constructor(
    parent: HTMLElement,
    map: maplibregl.Map,
    layer: Logistics3DLayer,
    location: LogisticsLocation,
    perfMonitor: PerformanceMonitor,
    cameraController: CameraController,
    inspectController: InspectController,
    orbitController: OrbitController
  ) {
    this.map = map;
    this.layer = layer;
    this.location = location;
    this.perfMonitor = perfMonitor;
    this.cameraController = cameraController;
    this.inspectController = inspectController;
    this.orbitController = orbitController;

    this.el = document.createElement('div');
    this.el.className = 'debug-panel';
    parent.appendChild(this.el);

    this.render();
    this.startUpdating();
  }

  private render(): void {
    const gl = (this.map.getCanvas().getContext('webgl2') ||
      this.map.getCanvas().getContext('webgl')) as WebGLRenderingContext | null;

    const glInfo = gl
      ? {
          version: gl.getParameter(gl.VERSION),
          renderer: gl.getParameter(gl.RENDERER),
          maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE)
        }
      : { version: 'N/A', renderer: 'N/A', maxTextureSize: 'N/A' };

    this.el.innerHTML = `
      <div class="debug-header">
        <span>ENGINEERING DEBUG [?debug=1]</span>
      </div>

      <div class="debug-row">
        <span class="debug-label">FPS / Frame Time</span>
        <span class="debug-val" id="dbg-fps">60 FPS / 16.6ms</span>
      </div>

      <div class="debug-row">
        <span class="debug-label">CAMERA MODE</span>
        <span class="debug-val" id="dbg-mode" style="color: var(--accent-green); font-weight: 700;">MAP</span>
      </div>

      <div class="debug-row">
        <span class="debug-label">DRAGGING</span>
        <span class="debug-val" id="dbg-dragging">false</span>
      </div>

      <div class="debug-row">
        <span class="debug-label">AUTO ORBIT</span>
        <span class="debug-val" id="dbg-orbit" style="color: #34d399; font-weight: 700;">OFF</span>
      </div>

      <div style="border-top: 1px solid rgba(255,255,255,0.08); margin: 2px 0;"></div>

      <div class="debug-row">
        <span class="debug-label">BEARING</span>
        <span class="debug-val" id="dbg-bearing">-35°</span>
      </div>

      <div class="debug-row">
        <span class="debug-label">PITCH</span>
        <span class="debug-val" id="dbg-pitch">60°</span>
      </div>

      <div class="debug-row">
        <span class="debug-label">ZOOM</span>
        <span class="debug-val" id="dbg-zoom">17.5</span>
      </div>

      <div class="debug-row">
        <span class="debug-label">TARGET (Lng, Lat)</span>
        <span class="debug-val">${this.location.longitude}, ${this.location.latitude}</span>
      </div>

      <div class="debug-row">
        <span class="debug-label">Camera Est. Altitude</span>
        <span class="debug-val" id="dbg-alt">95m</span>
      </div>

      <div style="border-top: 1px solid rgba(255,255,255,0.08); margin: 2px 0;"></div>

      <div class="debug-row">
        <span class="debug-label">Model Triangles</span>
        <span class="debug-val" id="dbg-triangles">278,791</span>
      </div>

      <div class="debug-row">
        <span class="debug-label">Meshes / Materials</span>
        <span class="debug-val" id="dbg-mesh-mat">1 meshes / 1 mats</span>
      </div>

      <div class="debug-row">
        <span class="debug-label">Local Bounding Box</span>
        <span class="debug-val" id="dbg-bounds">W: 1.68m, H: 0.58m</span>
      </div>

      <div class="debug-row">
        <span class="debug-label">WebGL Renderer</span>
        <span class="debug-val" style="font-size: 9px; max-width: 170px; word-break: break-all;">${glInfo.renderer}</span>
      </div>
    `;
  }

  private startUpdating(): void {
    const fpsEl = this.el.querySelector<HTMLElement>('#dbg-fps');
    const modeEl = this.el.querySelector<HTMLElement>('#dbg-mode');
    const draggingEl = this.el.querySelector<HTMLElement>('#dbg-dragging');
    const orbitEl = this.el.querySelector<HTMLElement>('#dbg-orbit');
    const bearingEl = this.el.querySelector('#dbg-bearing');
    const pitchEl = this.el.querySelector('#dbg-pitch');
    const zoomEl = this.el.querySelector('#dbg-zoom');
    const altEl = this.el.querySelector('#dbg-alt');
    const trianglesEl = this.el.querySelector('#dbg-triangles');
    const boundsEl = this.el.querySelector('#dbg-bounds');
    const meshMatEl = this.el.querySelector('#dbg-mesh-mat');

    this.updateTimer = window.setInterval(() => {
      if (fpsEl) {
        fpsEl.textContent = `${this.perfMonitor.getFps()} FPS / ${this.perfMonitor.getFrameTimeMs()}ms`;
      }

      const mode = this.inspectController.getMode();
      if (modeEl) {
        modeEl.textContent = mode;
        modeEl.style.color = mode === 'INSPECT' ? '#38bdf8' : mode === 'INTRO' ? '#f59e0b' : '#34d399';
      }

      if (draggingEl) {
        const isDragging = this.inspectController.getIsDragging();
        draggingEl.textContent = isDragging ? 'true' : 'false';
        draggingEl.style.color = isDragging ? '#38bdf8' : 'var(--text-secondary)';
      }

      if (orbitEl) {
        const isOrbiting = this.orbitController.getIsOrbiting();
        orbitEl.textContent = isOrbiting ? 'ON' : 'OFF';
        orbitEl.style.color = isOrbiting ? '#f87171' : '#34d399';
      }

      if (bearingEl) {
        bearingEl.textContent = `${Math.round(this.map.getBearing())}°`;
      }

      if (pitchEl) {
        pitchEl.textContent = `${Math.round(this.map.getPitch())}°`;
      }

      if (zoomEl) {
        zoomEl.textContent = this.map.getZoom().toFixed(1);
      }

      if (altEl) {
        altEl.textContent = `${this.cameraController.getEstimatedCameraAltitudeMeters()}m`;
      }

      if (this.layer.modelGroup && trianglesEl) {
        const stats = PerformanceMonitor.calculateSceneStats(this.layer.modelGroup);
        trianglesEl.textContent = stats.triangles.toLocaleString();
        if (meshMatEl) {
          meshMatEl.textContent = `${stats.meshes} meshes / ${stats.materials} mats`;
        }
      }

      if (this.layer.boundsInfo && boundsEl) {
        boundsEl.textContent = `W:${this.layer.boundsInfo.localWidth.toFixed(2)}m H:${this.layer.boundsInfo.localHeight.toFixed(2)}m D:${this.layer.boundsInfo.localDepth.toFixed(2)}m`;
      }
    }, 250);
  }

  public destroy(): void {
    if (this.updateTimer) clearInterval(this.updateTimer);
    this.el.remove();
  }
}
