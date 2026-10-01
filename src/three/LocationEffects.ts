import * as THREE from 'three';

export class LocationEffects {
  public group: THREE.Group;
  private innerRing: THREE.Mesh;
  private outerRing: THREE.Mesh;
  private locatorBeam: THREE.Mesh;
  private isSelected = false;
  private pulseTime = 0;
  // Local radius matching the model footprint (~1.68 x ~1.90)
  private baseRadius = 1.45;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'location_effects_group';

    // 1. Inner persistent indicator ring
    const innerGeom = new THREE.RingGeometry(this.baseRadius * 0.94, this.baseRadius * 0.98, 64);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    this.innerRing = new THREE.Mesh(innerGeom, innerMat);
    this.innerRing.rotation.x = -Math.PI / 2;
    this.innerRing.position.y = 0.012;
    this.group.add(this.innerRing);

    // 2. Outer pulsing wave ring
    const outerGeom = new THREE.RingGeometry(this.baseRadius * 0.98, this.baseRadius * 1.02, 64);
    const outerMat = new THREE.MeshBasicMaterial({
      color: 0x2dd4bf,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    this.outerRing = new THREE.Mesh(outerGeom, outerMat);
    this.outerRing.rotation.x = -Math.PI / 2;
    this.outerRing.position.y = 0.015;
    this.group.add(this.outerRing);

    // 3. Vertical locator beam (activated when selected, radius ~0.08, height ~1.2)
    this.locatorBeam = this.createLocatorBeam(0.08, 1.2);
    this.locatorBeam.position.y = 0.6;
    this.locatorBeam.visible = false;
    this.group.add(this.locatorBeam);
  }

  private createLocatorBeam(radius: number, height: number): THREE.Mesh {
    const geometry = new THREE.CylinderGeometry(radius * 0.3, radius, height, 32, 1, true);

    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    const grad = ctx.createLinearGradient(0, 256, 0, 0);
    grad.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
    grad.addColorStop(0.35, 'rgba(45, 212, 191, 0.2)');
    grad.addColorStop(1, 'rgba(56, 189, 248, 0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 256);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = 'locator_beam';
    return mesh;
  }

  public setSelected(selected: boolean): void {
    this.isSelected = selected;
    this.locatorBeam.visible = selected;

    const innerMat = this.innerRing.material as THREE.MeshBasicMaterial;
    if (selected) {
      innerMat.color.setHex(0x38bdf8);
      innerMat.opacity = 0.85;
    } else {
      innerMat.color.setHex(0x38bdf8);
      innerMat.opacity = 0.5;
    }
  }

  public update(deltaSeconds: number): void {
    this.pulseTime += deltaSeconds;

    // Outer ring pulse: 2.4s cycle
    const period = 2.4;
    const progress = (this.pulseTime % period) / period; // 0.0 -> 1.0

    // Scale from 1.0 -> 1.15
    const scale = 1.0 + progress * 0.15;
    this.outerRing.scale.set(scale, scale, 1);

    // Opacity fades out towards end of cycle
    const outerMat = this.outerRing.material as THREE.MeshBasicMaterial;
    const baseOpacity = this.isSelected ? 0.65 : 0.35;
    outerMat.opacity = baseOpacity * (1 - progress);

    // Subtle slow rotation of inner ring
    this.innerRing.rotation.z += deltaSeconds * 0.15;

    if (this.isSelected && this.locatorBeam.visible) {
      this.locatorBeam.rotation.y += deltaSeconds * 0.35;
    }
  }
}
