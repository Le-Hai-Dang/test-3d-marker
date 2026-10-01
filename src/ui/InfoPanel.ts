import type { LogisticsLocation } from '../data/logisticsLocation';

export interface InfoPanelCallbacks {
  onCenterCamera?: () => void;
  onToggleRoute?: () => void;
  onViewDetails?: () => void;
  onClose?: () => void;
}

export class InfoPanel {
  private el: HTMLElement;
  private location: LogisticsLocation;
  private callbacks: InfoPanelCallbacks = {};
  private isOpen = false;

  constructor(parent: HTMLElement, location: LogisticsLocation, callbacks: InfoPanelCallbacks = {}) {
    this.location = location;
    this.callbacks = callbacks;

    this.el = document.createElement('div');
    this.el.className = 'side-panel';
    parent.appendChild(this.el);

    this.render();
  }

  public setOnClose(cb: () => void): void {
    this.callbacks.onClose = cb;
  }

  public setOnCenterCamera(cb: () => void): void {
    this.callbacks.onCenterCamera = cb;
  }

  public setOnToggleRoute(cb: () => void): void {
    this.callbacks.onToggleRoute = cb;
  }

  private render(): void {
    const { name, subtitle, status, metrics, activities } = this.location;

    this.el.innerHTML = `
      <div class="panel-header">
        <div class="panel-title-wrap">
          <div class="panel-title">${name}</div>
          <div class="panel-subtitle">${subtitle}</div>
        </div>
        <button class="panel-close-btn" id="btn-close-panel" aria-label="Close panel">✕</button>
      </div>

      <div class="panel-body">
        <div class="metric-status-row">
          <span class="status-label">Operational Status</span>
          <span class="status-value">
            <span class="pulse-dot"></span>
            ${status}
          </span>
        </div>

        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-num">${metrics.containers}</div>
            <div class="metric-title">Containers</div>
          </div>
          <div class="metric-card">
            <div class="metric-num">${metrics.vehiclesProcessing}</div>
            <div class="metric-title">Vehicles Processing</div>
          </div>
          <div class="metric-card">
            <div class="metric-num">${metrics.capacityPercent}%</div>
            <div class="metric-title">Capacity</div>
          </div>
          <div class="metric-card">
            <div class="metric-num">${metrics.loadingZones}</div>
            <div class="metric-title">Loading Zones</div>
          </div>
        </div>

        <div class="metric-status-row">
          <span class="status-label">Avg. Processing Time</span>
          <span class="status-label tabular" style="color: var(--text-primary); font-weight: 600;">
            ${metrics.averageProcessingMinutes} min
          </span>
        </div>

        <div class="activity-section">
          <div class="section-title">Live Activity Log</div>
          <div class="activity-list">
            ${activities
              .map(
                (act) => `
              <div class="activity-item">
                <span class="activity-time">${act.time}</span>
                <span class="activity-text">${act.text}</span>
              </div>
            `
              )
              .join('')}
          </div>
        </div>
      </div>

      <div class="panel-actions">
        <button class="action-btn-primary" id="btn-center-camera">Center Camera</button>
        <button class="action-btn-secondary" id="btn-details">View Facility Details</button>
      </div>
    `;

    this.bindEvents();
  }

  private bindEvents(): void {
    const closeBtn = this.el.querySelector('#btn-close-panel') as HTMLButtonElement;
    closeBtn.addEventListener('click', () => {
      this.close();
      if (this.callbacks.onClose) this.callbacks.onClose();
    });

    const centerBtn = this.el.querySelector('#btn-center-camera') as HTMLButtonElement;
    centerBtn.addEventListener('click', () => {
      if (this.callbacks.onCenterCamera) this.callbacks.onCenterCamera();
    });

    const detailsBtn = this.el.querySelector('#btn-details') as HTMLButtonElement;
    detailsBtn.addEventListener('click', () => {
      if (this.callbacks.onViewDetails) this.callbacks.onViewDetails();
    });
  }

  public open(): void {
    this.isOpen = true;
    this.el.classList.add('open');
  }

  public close(): void {
    this.isOpen = false;
    this.el.classList.remove('open');
  }

  public getIsOpen(): boolean {
    return this.isOpen;
  }

  public destroy(): void {
    this.el.remove();
  }
}
