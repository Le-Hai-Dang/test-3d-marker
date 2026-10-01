export class LoadingScreen {
  private el: HTMLElement;
  private statusEl!: HTMLElement;
  private barEl!: HTMLElement;

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'loading-overlay';
    document.body.appendChild(this.el);

    this.render();
  }

  private render(): void {
    this.el.innerHTML = `
      <div class="loading-spinner"></div>
      <div class="loading-title">Logistics 3D Control</div>
      <div class="loading-status" id="loading-status-text">Initializing geospatial environment...</div>
      <div class="loading-bar-wrap">
        <div class="loading-bar-progress" id="loading-bar-inner"></div>
      </div>
    `;

    this.statusEl = this.el.querySelector('#loading-status-text')!;
    this.barEl = this.el.querySelector('#loading-bar-inner')!;
  }

  public setProgress(percent: number, statusText?: string): void {
    const clamped = Math.max(0, Math.min(100, percent));
    if (this.barEl) {
      this.barEl.style.width = `${clamped}%`;
    }
    if (this.statusEl) {
      if (statusText) {
        this.statusEl.textContent = `${statusText} (${clamped}%)`;
      } else {
        this.statusEl.textContent = `Loading 3D logistics model (${clamped}%)`;
      }
    }
  }

  public hide(): void {
    this.el.classList.add('fade-out');
    setTimeout(() => {
      this.el.remove();
    }, 700);
  }

  public showError(title: string, details: string): void {
    this.el.innerHTML = `
      <div style="font-size: 28px; color: var(--accent-red); margin-bottom: 8px;">⚠</div>
      <div class="loading-title" style="color: var(--accent-red);">${title}</div>
      <div class="loading-status" style="max-width: 380px; text-align: center; margin-top: 6px; line-height: 1.4;">
        ${details}
      </div>
      <button style="margin-top: 16px; padding: 8px 16px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #fff; border-radius: 6px; cursor: pointer;" onclick="location.reload()">
        Retry Loading
      </button>
    `;
  }
}
