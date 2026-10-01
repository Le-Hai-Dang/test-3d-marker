import * as THREE from 'three';
import maplibregl from 'maplibre-gl';
import type { LogisticsLocation } from '../data/logisticsLocation';
import { ModelLoader } from './ModelLoader';
import { ModelUtils, type ModelBoundsInfo } from './ModelUtils';
import { Lighting } from './Lighting';
import { LocationEffects } from './LocationEffects';

export class Logistics3DLayer implements maplibregl.CustomLayerInterface {
  public id = 'logistics-3d-layer';
  public type: 'custom' = 'custom';
  public renderingMode: '3d' = '3d';

  private map!: maplibregl.Map;
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.Camera;
  private lighting!: Lighting;
  private effects!: LocationEffects;

  public modelGroup: THREE.Group | null = null;
  public boundsInfo: ModelBoundsInfo | null = null;
  private originalMaterials = new Map<THREE.Mesh, { emissive: THREE.Color; emissiveIntensity: number }>();

  public location: LogisticsLocation;
  private localWidth = 1.681; // fallback until bounds computed
  private isHovered = false;
  private lastRenderTime = performance.now();
  private onModelLoaded?: (bounds: ModelBoundsInfo) => void;
  private onModelLoadError?: (err: Error) => void;
  private onProgress?: (percent: number) => void;

  constructor(
    location: LogisticsLocation,
    callbacks?: {
      onProgress?: (percent: number) => void;
      onModelLoaded?: (bounds: ModelBoundsInfo) => void;
      onModelLoadError?: (err: Error) => void;
    }
  ) {
    this.location = location;
    if (callbacks) {
      this.onProgress = callbacks.onProgress;
      this.onModelLoaded = callbacks.onModelLoaded;
      this.onModelLoadError = callbacks.onModelLoadError;
    }
  }

  public onAdd(map: maplibregl.Map, gl: WebGLRenderingContext): void {
    this.map = map;
    this.camera = new THREE.Camera();
    this.scene = new THREE.Scene();

    this.renderer = new THREE.WebGLRenderer({
      canvas: map.getCanvas(),
      context: gl,
      antialias: true
    });
    this.renderer.autoClear = false;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    // Add lighting setup
    this.lighting = new Lighting();
    this.scene.add(this.lighting.group);

    // Add location rings and locator beam
    this.effects = new LocationEffects();
    this.scene.add(this.effects.group);

    // Load GLB model
    const loader = new ModelLoader();
    loader.load(this.location.modelUrl, {
      onProgress: (percent) => {
        if (this.onProgress) this.onProgress(percent);
      },
      onSuccess: (loadedScene) => {
        this.modelGroup = loadedScene;

        // Ground align & center model locally
        this.boundsInfo = ModelUtils.groundAlignAndCenter(this.modelGroup);
        this.localWidth = this.boundsInfo.localWidth || 1.681;

        // Configure materials and save original state for hover restoration
        this.originalMaterials = ModelUtils.configureMaterials(this.modelGroup);

        this.scene.add(this.modelGroup);

        if (this.onModelLoaded && this.boundsInfo) {
          this.onModelLoaded(this.boundsInfo);
        }

        this.map.triggerRepaint();
      },
      onError: (err) => {
        if (this.onModelLoadError) this.onModelLoadError(err);
      }
    });
  }

  public render(
    _gl: WebGLRenderingContext | WebGL2RenderingContext,
    matrix: Parameters<maplibregl.CustomRenderMethod>[1]
  ): void {
    const now = performance.now();
    const deltaSeconds = Math.min(0.1, (now - this.lastRenderTime) / 1000);
    this.lastRenderTime = now;

    // Update dynamic pulse effects
    if (this.effects) {
      this.effects.update(deltaSeconds);
    }

    // Compute Mercator transform
    const mercator = maplibregl.MercatorCoordinate.fromLngLat(
      [this.location.longitude, this.location.latitude],
      this.location.altitude
    );

    const meterScale = mercator.meterInMercatorCoordinateUnits();
    // Scale factor converting local meter space into Mercator space
    const targetScale = (this.location.targetWidthMeters / this.localWidth) * meterScale;

    // Rotation around X (Three.js Y-up to MapLibre Z-up)
    const rotX = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(1, 0, 0), Math.PI / 2);
    // Heading rotation around model's local vertical (Y-up) axis
    const headingRad = (this.location.headingDegrees * Math.PI) / 180;
    const rotY = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 1, 0), headingRad);

    const translation = new THREE.Matrix4().makeTranslation(mercator.x, mercator.y, mercator.z);
    const scale = new THREE.Matrix4().makeScale(targetScale, -targetScale, targetScale);

    const modelMatrix = translation
      .multiply(scale)
      .multiply(rotX)
      .multiply(rotY);

    const mapMatrix = new THREE.Matrix4().fromArray(matrix as ArrayLike<number>);
    this.camera.projectionMatrix = mapMatrix.multiply(modelMatrix);

    this.renderer.resetState();
    this.renderer.render(this.scene, this.camera);

    // Keep pulse ring animated smoothly
    this.map.triggerRepaint();
  }

  public setHovered(hovered: boolean): void {
    if (this.isHovered === hovered || !this.modelGroup) return;
    this.isHovered = hovered;

    this.modelGroup.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (mat && mat.isMeshStandardMaterial) {
          const orig = this.originalMaterials.get(mesh);
          if (hovered) {
            mat.emissive.setHex(0x18425a);
            mat.emissiveIntensity = 0.75;
          } else if (orig) {
            mat.emissive.copy(orig.emissive);
            mat.emissiveIntensity = orig.emissiveIntensity;
          }
        }
      }
    });

    this.map.triggerRepaint();
  }

  public setSelected(selected: boolean): void {
    if (this.effects) {
      this.effects.setSelected(selected);
      this.map.triggerRepaint();
    }
  }

  public getRaycastCamera(): THREE.Camera {
    return this.camera;
  }

  public getProjectionMatrix(): THREE.Matrix4 {
    return this.camera.projectionMatrix;
  }

  public getScene(): THREE.Scene {
    return this.scene;
  }

  public onRemove(): void {
    if (this.modelGroup) {
      this.modelGroup.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          if (mesh.geometry) mesh.geometry.dispose();
          if (mesh.material) {
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            for (const m of mats) m.dispose();
          }
        }
      });
    }

    if (this.renderer) {
      this.renderer.dispose();
    }
  }
}
