import { CameraMode } from '../interaction/InspectController';

export class Hud {
  private container: HTMLElement;
  private zoomEl!: HTMLElement;
  private pitchEl!: HTMLElement;
  private bearingEl!: HTMLElement;
  private altEl!: HTMLElement;
  private modeEl!: HTMLElement;
  private clockEl!: HTMLElement;
  private toastEl!: HTMLElement;
  private inspectHintEl!: HTMLElement;
  private clockTimer: number | null = null;
  private toastTimer: number | null = null;
  private hintTimer: number | null = null;

  constructor(parent: HTMLElement) {
    this.container = document.createElement('div');
    this.container.className = 'hud-container';
    parent.appendChild(this.container);

    this.render();
    this.startClock();
  }

  private render(): void {
    // 1. Top Left Branding & Mode indicator
    const topLeft = document.createElement('div');
    topLeft.className = 'hud-top-left';
    topLeft.innerHTML = `
      <div class="brand-title">
        <span>Logistics 3D Control</span>
      </div>
      <div class="brand-subtitle">Digital Twin GIS Prototype</div>
      <div class="status-badge">
        <div class="pulse-dot"></div>
        <span id="hud-sys-status">SYSTEM ONLINE</span>
      </div>
      <div class="mode-tag" id="hud-nav-mode">MODE: MAP VIEW</div>
    `;
    this.container.appendChild(topLeft);
    this.modeEl = topLeft.querySelector('#hud-nav-mode')!;

    // 2. Top Right Badges & Clock
    const topRight = document.createElement('div');
    topRight.className = 'hud-top-right';
    topRight.innerHTML = `
      <div class="hud-tag">WEBGL 3D</div>
      <div class="hud-tag">LIVE</div>
      <div class="clock-display" id="hud-clock">00:00:00</div>
    `;
    this.container.appendChild(topRight);
    this.clockEl = topRight.querySelector('#hud-clock')!;

    // 3. Bottom Left Telemetry (with Altitude)
    const bottomLeft = document.createElement('div');
    bottomLeft.className = 'hud-bottom-left';
    bottomLeft.innerHTML = `
      <div class="telemetry-item">
        <span class="telemetry-label">ZOOM</span>
        <span class="telemetry-value" id="val-zoom">17.5</span>
      </div>
      <div class="telemetry-item">
        <span class="telemetry-label">PITCH</span>
        <span class="telemetry-value" id="val-pitch">60°</span>
      </div>
      <div class="telemetry-item">
        <span class="telemetry-label">BEARING</span>
        <span class="telemetry-value" id="val-bearing">-35°</span>
      </div>
      <div class="telemetry-item">
        <span class="telemetry-label">ALTITUDE</span>
        <span class="telemetry-value" id="val-alt">95m</span>
      </div>
    `;
    this.container.appendChild(bottomLeft);
    this.zoomEl = bottomLeft.querySelector('#val-zoom')!;
    this.pitchEl = bottomLeft.querySelector('#val-pitch')!;
    this.bearingEl = bottomLeft.querySelector('#val-bearing')!;
    this.altEl = bottomLeft.querySelector('#val-alt')!;

    // 4. Floating Guidance Hint Overlay for 3D Controls
    this.inspectHintEl = document.createElement('div');
    this.inspectHintEl.className = 'inspect-guidance-pill';
    this.inspectHintEl.innerHTML = `
      <div class="guidance-title">3D CONTROLS</div>
      <div class="guidance-desc">
        <span>🖱️ <b>Drag:</b> Rotate</span>
        <span>•</span>
        <span>↕️ <b>Drag Up/Down:</b> Tilt</span>
        <span>•</span>
        <span>⚙️ <b>Scroll:</b> Zoom</span>
        <span>•</span>
        <span>⌨️ <b>ESC:</b> Exit</span>
      </div>
    `;
    this.container.appendChild(this.inspectHintEl);

    // 5. Toast notification element
    this.toastEl = document.createElement('div');
    this.toastEl.className = 'toast-msg';
    document.body.appendChild(this.toastEl);
  }

  public updateTelemetry(zoom: number, pitch: number, bearing: number, altitudeMeters = 95): void {
    if (this.zoomEl) this.zoomEl.textContent = zoom.toFixed(1);
    if (this.pitchEl) this.pitchEl.textContent = `${Math.round(pitch)}°`;
    if (this.bearingEl) this.bearingEl.textContent = `${Math.round(bearing)}°`;
    if (this.altEl) this.altEl.textContent = `${altitudeMeters}m`;
  }

  public setMode(mode: CameraMode | boolean): void {
    if (!this.modeEl) return;

    if (mode === CameraMode.INSPECT || mode === true) {
      this.modeEl.textContent = 'MODE: 3D INSPECT';
      this.modeEl.classList.add('inspect');
      this.showInspectHint();
    } else if (mode === CameraMode.INTRO) {
      this.modeEl.textContent = 'MODE: INTRO FLYOVER';
      this.modeEl.classList.remove('inspect');
      this.hideInspectHint();
    } else {
      this.modeEl.textContent = 'MODE: MAP VIEW';
      this.modeEl.classList.remove('inspect');
      this.hideInspectHint();
    }
  }

  public showInspectHint(): void {
    if (this.hintTimer) clearTimeout(this.hintTimer);
    this.inspectHintEl.classList.add('visible');
    // Auto-fade after 3 seconds per user specification
    this.hintTimer = window.setTimeout(() => {
      this.inspectHintEl.classList.remove('visible');
    }, 3000);
  }

  public hideInspectHint(): void {
    if (this.hintTimer) clearTimeout(this.hintTimer);
    this.inspectHintEl.classList.remove('visible');
  }

  public showToast(msg: string): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastEl.textContent = msg;
    this.toastEl.classList.add('show');
    this.toastTimer = window.setTimeout(() => {
      this.toastEl.classList.remove('show');
    }, 2500);
  }

  private startClock(): void {
    const updateTime = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      if (this.clockEl) {
        this.clockEl.textContent = `${h}:${m}:${s}`;
      }
    };
    updateTime();
    this.clockTimer = window.setInterval(updateTime, 1000);
  }

  public destroy(): void {
    if (this.clockTimer) clearInterval(this.clockTimer);
    if (this.toastTimer) clearTimeout(this.toastTimer);
    if (this.hintTimer) clearTimeout(this.hintTimer);
    this.container.remove();
    this.toastEl.remove();
  }
}
