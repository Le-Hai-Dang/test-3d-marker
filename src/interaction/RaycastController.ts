import * as THREE from 'three';
import maplibregl from 'maplibre-gl';
import type { Logistics3DLayer } from '../three/Logistics3DLayer';

export interface RaycastCallbacks {
  onHoverChange: (isHovered: boolean, mouseX: number, mouseY: number) => void;
  onModelClick: () => void;
  onMapClick: () => void;
}

export class RaycastController {
  private map: maplibregl.Map;
  private layer: Logistics3DLayer;
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private callbacks: RaycastCallbacks;
  private isCurrentlyHovered = false;

  constructor(map: maplibregl.Map, layer: Logistics3DLayer, callbacks: RaycastCallbacks) {
    this.map = map;
    this.layer = layer;
    this.callbacks = callbacks;

    this.bindEvents();
  }

  private bindEvents(): void {
    const canvas = this.map.getCanvas();

    canvas.addEventListener('mousemove', this.handleMouseMove);
    canvas.addEventListener('mouseleave', this.handleMouseLeave);

    // MapLibre native click event handles drag-detection and mobile tap seamlessly
    this.map.on('click', this.handleMapClick);
  }

  private handleMapClick = (e: maplibregl.MapMouseEvent): void => {
    const canvas = this.map.getCanvas();
    this.mouse.x = (e.point.x / canvas.clientWidth) * 2 - 1;
    this.mouse.y = -(e.point.y / canvas.clientHeight) * 2 + 1;

    const hit = this.performRaycast();
    if (hit) {
      this.callbacks.onModelClick();
    } else {
      this.callbacks.onMapClick();
    }
  };

  private handleMouseMove = (e: MouseEvent): void => {
    const canvas = this.map.getCanvas();
    const rect = canvas.getBoundingClientRect();

    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const hit = this.performRaycast();

    if (hit !== this.isCurrentlyHovered) {
      this.isCurrentlyHovered = hit;
      this.layer.setHovered(hit);
      if (hit) {
        this.map.getContainer().classList.add('cursor-pointer');
      } else {
        this.map.getContainer().classList.remove('cursor-pointer');
      }
    }

    this.callbacks.onHoverChange(hit, e.clientX, e.clientY);
  };

  private handleMouseLeave = (): void => {
    if (this.isCurrentlyHovered) {
      this.isCurrentlyHovered = false;
      this.layer.setHovered(false);
      this.map.getContainer().classList.remove('cursor-pointer');
      this.callbacks.onHoverChange(false, 0, 0);
    }
  };

  private performRaycast(): boolean {
    if (!this.layer.modelGroup) return false;

    const projMatrix = this.layer.getProjectionMatrix();
    if (!projMatrix) return false;

    const inv = new THREE.Matrix4().copy(projMatrix).invert();

    // Near plane point (z = -1) in homogeneous clip coordinates
    const vNear = new THREE.Vector4(this.mouse.x, this.mouse.y, -1, 1).applyMatrix4(inv);
    if (Math.abs(vNear.w) < 1e-7) return false;
    const pNear = new THREE.Vector3(vNear.x / vNear.w, vNear.y / vNear.w, vNear.z / vNear.w);

    // Far plane point (z = 1) in homogeneous clip coordinates
    const vFar = new THREE.Vector4(this.mouse.x, this.mouse.y, 1, 1).applyMatrix4(inv);
    if (Math.abs(vFar.w) < 1e-7) return false;
    const pFar = new THREE.Vector3(vFar.x / vFar.w, vFar.y / vFar.w, vFar.z / vFar.w);

    const dir = new THREE.Vector3().subVectors(pFar, pNear).normalize();
    this.raycaster.ray.origin.copy(pNear);
    this.raycaster.ray.direction.copy(dir);

    const intersects = this.raycaster.intersectObject(this.layer.modelGroup, true);
    return intersects.length > 0;
  }

  public destroy(): void {
    const canvas = this.map.getCanvas();
    canvas.removeEventListener('mousemove', this.handleMouseMove);
    canvas.removeEventListener('mouseleave', this.handleMouseLeave);
    this.map.off('click', this.handleMapClick);
  }
}
