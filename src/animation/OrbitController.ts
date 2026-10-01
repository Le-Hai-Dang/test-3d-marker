import maplibregl from 'maplibre-gl';
import type { LogisticsLocation } from '../data/logisticsLocation';

export class OrbitController {
  private map: maplibregl.Map;
  private location: LogisticsLocation;
  private isOrbiting = false;
  private animFrameId: number | null = null;
  private lastTime = performance.now();
  private orbitSpeedDegPerSec = 1.2; // Smooth cinematic rotation
  private onStateChange?: (active: boolean) => void;

  constructor(map: maplibregl.Map, location: LogisticsLocation, onStateChange?: (active: boolean) => void) {
    this.map = map;
    this.location = location;
    this.onStateChange = onStateChange;

    this.bindInterruptEvents();
  }

  private bindInterruptEvents(): void {
    const canvas = this.map.getCanvas();
    const stopIfUserAction = () => {
      if (this.isOrbiting) {
        this.stop();
      }
    };

    canvas.addEventListener('wheel', stopIfUserAction, { passive: true });
    canvas.addEventListener('mousedown', stopIfUserAction);
    canvas.addEventListener('touchstart', stopIfUserAction, { passive: true });
  }

  public start(): void {
    if (this.isOrbiting) return;
    this.isOrbiting = true;
    this.lastTime = performance.now();
    if (this.onStateChange) this.onStateChange(true);
    this.step();
  }

  public stop(): void {
    if (!this.isOrbiting) return;
    this.isOrbiting = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.onStateChange) this.onStateChange(false);
  }

  public toggle(): boolean {
    if (this.isOrbiting) {
      this.stop();
    } else {
      this.start();
    }
    return this.isOrbiting;
  }

  public getIsOrbiting(): boolean {
    return this.isOrbiting;
  }

  private step = (): void => {
    if (!this.isOrbiting) return;

    const now = performance.now();
    const deltaSeconds = (now - this.lastTime) / 1000;
    this.lastTime = now;

    const currentBearing = this.map.getBearing();
    const newBearing = (currentBearing + this.orbitSpeedDegPerSec * deltaSeconds) % 360;

    // Rotate bearing while maintaining map center on model
    this.map.jumpTo({
      center: [this.location.longitude, this.location.latitude],
      bearing: newBearing
    });

    this.animFrameId = requestAnimationFrame(this.step);
  };
}
