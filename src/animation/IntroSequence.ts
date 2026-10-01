import maplibregl from 'maplibre-gl';
import type { LogisticsLocation } from '../data/logisticsLocation';

export type IntroState = 'IDLE' | 'PLAYING' | 'INTERRUPTED' | 'COMPLETED';

export class IntroSequence {
  private map: maplibregl.Map;
  private location: LogisticsLocation;
  private state: IntroState = 'IDLE';
  private onCompleteCallback?: () => void;
  private animFrameId: number | null = null;
  private startTime = 0;
  private durationMs = 6000; // 6 seconds cinematic sequence

  constructor(map: maplibregl.Map, location: LogisticsLocation) {
    this.map = map;
    this.location = location;

    this.bindInterruptEvents();
  }

  private bindInterruptEvents(): void {
    const canvas = this.map.getCanvas();
    const interrupt = () => this.interrupt();

    canvas.addEventListener('wheel', interrupt, { passive: true });
    canvas.addEventListener('mousedown', interrupt);
    canvas.addEventListener('touchstart', interrupt, { passive: true });
    window.addEventListener('keydown', interrupt);
  }

  public play(onComplete?: () => void): void {
    if (this.state === 'PLAYING') return;
    this.state = 'PLAYING';
    this.onCompleteCallback = onComplete;

    // Set initial distant framing
    this.map.jumpTo({
      center: [this.location.longitude + 0.0035, this.location.latitude - 0.003],
      zoom: 14.8,
      pitch: 28,
      bearing: -15
    });

    this.startTime = performance.now();
    this.step();
  }

  private step = (): void => {
    if (this.state !== 'PLAYING') return;

    const now = performance.now();
    const elapsed = now - this.startTime;
    const progress = Math.min(1, elapsed / this.durationMs);

    // Smooth cubic ease-in-out
    const t = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;

    // Interpolate camera parameters towards target composition
    const startLng = this.location.longitude + 0.0035;
    const startLat = this.location.latitude - 0.003;
    const currentLng = startLng + (this.location.longitude - startLng) * t;
    const currentLat = startLat + (this.location.latitude - startLat) * t;

    const currentZoom = 14.8 + (17.3 - 14.8) * t;
    const currentPitch = 28 + (62 - 28) * t;
    const currentBearing = -15 + (-35 - -15) * t;

    this.map.jumpTo({
      center: [currentLng, currentLat],
      zoom: currentZoom,
      pitch: currentPitch,
      bearing: currentBearing
    });

    if (progress < 1) {
      this.animFrameId = requestAnimationFrame(this.step);
    } else {
      this.state = 'COMPLETED';
      if (this.onCompleteCallback) {
        this.onCompleteCallback();
      }
    }
  };

  public interrupt(): void {
    if (this.state === 'PLAYING') {
      this.state = 'INTERRUPTED';
      if (this.animFrameId !== null) {
        cancelAnimationFrame(this.animFrameId);
        this.animFrameId = null;
      }
    }
  }

  public getState(): IntroState {
    return this.state;
  }
}
