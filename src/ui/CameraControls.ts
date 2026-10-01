import type { CameraPreset } from '../map/cameraController';

export interface CameraControlsCallbacks {
  onPreset: (preset: CameraPreset) => void;
  onToggleOrbit: () => void;
  onToggleInspect: () => void;
  onAdjustAltitude: (deltaMeters: number) => void;
  onReset: () => void;
}

export class CameraControls {
  private el: HTMLElement;
  private callbacks: CameraControlsCallbacks;
  private orbitBtn!: HTMLButtonElement;
  private inspectBtn!: HTMLButtonElement;

  constructor(parent: HTMLElement, callbacks: CameraControlsCallbacks) {
    this.callbacks = callbacks;
    this.el = document.createElement('div');
    this.el.className = 'hud-bottom-center';
    parent.appendChild(this.el);

    this.render();
  }

  private render(): void {
    this.el.innerHTML = `
      <button class="preset-btn btn-inspect" id="btn-inspect" aria-label="Toggle 3D Orbit Inspect Mode">
        <span class="inspect-icon">🔄</span>
        <span>Inspect 3D</span>
      </button>

      <div class="preset-divider"></div>

      <button class="preset-btn" data-preset="top" aria-label="Top-down camera angle">Top</button>
      <button class="preset-btn active" data-preset="isometric" aria-label="Isometric camera angle">Iso</button>
      <button class="preset-btn" data-preset="front" aria-label="Front camera angle">Front</button>
      <button class="preset-btn" data-preset="right" aria-label="Right side camera angle">Right</button>
      <button class="preset-btn" data-preset="back" aria-label="Back camera angle">Back</button>
      <button class="preset-btn" data-preset="left" aria-label="Left side camera angle">Left</button>

      <div class="preset-divider"></div>

      <div class="altitude-control-group">
        <span class="alt-label">ALT</span>
        <button class="btn-alt" id="btn-alt-down" title="Lower Camera Altitude (PageDown)">−</button>
        <button class="btn-alt" id="btn-alt-up" title="Raise Camera Altitude (PageUp)">+</button>
      </div>

      <div class="preset-divider"></div>

      <button class="preset-btn" id="btn-orbit" aria-label="Toggle camera auto orbit">Orbit</button>
      <button class="preset-btn" id="btn-reset" aria-label="Reset camera position">Reset</button>
    `;

    this.inspectBtn = this.el.querySelector('#btn-inspect')!;
    this.orbitBtn = this.el.querySelector('#btn-orbit')!;

    // 3D Inspect Mode Toggle
    this.inspectBtn.addEventListener('click', () => {
      this.callbacks.onToggleInspect();
    });

    // Preset Buttons
    const presetBtns = this.el.querySelectorAll<HTMLButtonElement>('[data-preset]');
    presetBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        presetBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const preset = btn.getAttribute('data-preset') as CameraPreset;
        this.callbacks.onPreset(preset);
      });
    });

    // Altitude Buttons
    const altDown = this.el.querySelector('#btn-alt-down') as HTMLButtonElement;
    altDown.addEventListener('click', () => {
      this.callbacks.onAdjustAltitude(-30);
    });

    const altUp = this.el.querySelector('#btn-alt-up') as HTMLButtonElement;
    altUp.addEventListener('click', () => {
      this.callbacks.onAdjustAltitude(30);
    });

    // Orbit Toggle
    this.orbitBtn.addEventListener('click', () => {
      this.callbacks.onToggleOrbit();
    });

    // Reset
    const resetBtn = this.el.querySelector('#btn-reset') as HTMLButtonElement;
    resetBtn.addEventListener('click', () => {
      presetBtns.forEach((b) => b.classList.remove('active'));
      const isoBtn = this.el.querySelector('[data-preset="isometric"]');
      if (isoBtn) isoBtn.classList.add('active');
      this.callbacks.onReset();
    });
  }

  public setInspectActive(active: boolean): void {
    if (this.inspectBtn) {
      if (active) {
        this.inspectBtn.classList.add('active');
      } else {
        this.inspectBtn.classList.remove('active');
      }
    }
  }

  public setOrbitActive(active: boolean): void {
    if (this.orbitBtn) {
      if (active) {
        this.orbitBtn.classList.add('active');
      } else {
        this.orbitBtn.classList.remove('active');
      }
    }
  }

  public setActivePreset(preset: CameraPreset): void {
    const btns = this.el.querySelectorAll<HTMLButtonElement>('[data-preset]');
    btns.forEach((btn) => {
      if (btn.getAttribute('data-preset') === preset) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  public destroy(): void {
    this.el.remove();
  }
}
