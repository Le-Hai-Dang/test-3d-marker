import type { LogisticsLocation } from '../data/logisticsLocation';
import type { Logistics3DLayer } from '../three/Logistics3DLayer';
import type { CameraController } from '../map/cameraController';
import type { InfoPanel } from '../ui/InfoPanel';

export class SelectionController {
  private layer: Logistics3DLayer;
  private cameraController: CameraController;
  private infoPanel: InfoPanel;
  private location: LogisticsLocation;
  private isSelected = false;

  constructor(
    location: LogisticsLocation,
    layer: Logistics3DLayer,
    cameraController: CameraController,
    infoPanel: InfoPanel
  ) {
    this.location = location;
    this.layer = layer;
    this.cameraController = cameraController;
    this.infoPanel = infoPanel;

    // Listen to ESC key to deselect
    window.addEventListener('keydown', this.handleKeyDown);

    // Wire up panel close event
    this.infoPanel.setOnClose(() => {
      this.deselect();
    });
  }

  public select(): void {
    if (this.isSelected) return;
    this.isSelected = true;

    this.layer.setSelected(true);
    this.infoPanel.open();

    // Adjust camera focusing with padding for desktop panel (360px)
    const isMobile = window.innerWidth <= 768;
    const paddingRight = isMobile ? 0 : 360;

    this.cameraController.focusLocation(this.location, {
      zoom: 17.5,
      pitch: 62,
      bearing: -35,
      paddingRight,
      duration: 1800
    });
  }

  public deselect(): void {
    if (!this.isSelected) return;
    this.isSelected = false;

    this.layer.setSelected(false);
    this.infoPanel.close();

    // Reset camera padding smoothly
    this.cameraController.focusLocation(this.location, {
      paddingRight: 0,
      duration: 1200
    });
  }

  public getIsSelected(): boolean {
    return this.isSelected;
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape' && this.isSelected) {
      this.deselect();
    }
  };

  public destroy(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
  }
}
