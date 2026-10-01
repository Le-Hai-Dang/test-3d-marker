import type { LogisticsLocation } from '../data/logisticsLocation';

export class Tooltip {
  private el: HTMLElement;
  private isVisible = false;

  constructor(parent: HTMLElement) {
    this.el = document.createElement('div');
    this.el.className = 'location-tooltip';
    parent.appendChild(this.el);
  }

  public setContent(location: LogisticsLocation): void {
    this.el.innerHTML = `
      <div class="tooltip-title">${location.name}</div>
      <div class="tooltip-status">
        <div class="pulse-dot"></div>
        <span>ĐANG HOẠT ĐỘNG</span>
      </div>
      <div class="tooltip-grid">
        <span class="tooltip-label">Công suất</span>
        <span class="tooltip-val">${location.metrics.capacityPercent}%</span>
        <span class="tooltip-label">Container</span>
        <span class="tooltip-val">${location.metrics.containers}</span>
        <span class="tooltip-label">Xe xử lý</span>
        <span class="tooltip-val">${location.metrics.vehiclesProcessing}</span>
        <span class="tooltip-label">Cửa bốc dỡ</span>
        <span class="tooltip-val">${location.metrics.loadingZones}</span>
      </div>
    `;
  }

  public show(x: number, y: number): void {
    this.el.style.left = `${x}px`;
    this.el.style.top = `${y}px`;

    if (!this.isVisible) {
      this.isVisible = true;
      this.el.classList.add('visible');
    }
  }

  public hide(): void {
    if (this.isVisible) {
      this.isVisible = false;
      this.el.classList.remove('visible');
    }
  }

  public destroy(): void {
    this.el.remove();
  }
}
