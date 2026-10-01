import * as THREE from 'three';

export interface PerformanceStats {
  fps: number;
  frameTimeMs: number;
  triangles: number;
  meshes: number;
  materials: number;
  textures: number;
}

export class PerformanceMonitor {
  private lastTime = performance.now();
  private frameCount = 0;
  private fps = 60;
  private frameTimeMs = 16.6;
  private lastUpdate = performance.now();
  private updateIntervalMs = 500; // update 2 times per second

  public tick(): void {
    const now = performance.now();
    this.frameCount++;
    const delta = now - this.lastTime;
    this.lastTime = now;

    if (now - this.lastUpdate >= this.updateIntervalMs) {
      const elapsed = (now - this.lastUpdate) / 1000;
      this.fps = Math.round(this.frameCount / elapsed);
      this.frameTimeMs = Math.round(delta * 10) / 10;
      this.frameCount = 0;
      this.lastUpdate = now;
    }
  }

  public getFps(): number {
    return this.fps;
  }

  public getFrameTimeMs(): number {
    return this.frameTimeMs;
  }

  public static calculateSceneStats(scene: THREE.Object3D): {
    triangles: number;
    meshes: number;
    materials: number;
    textures: number;
  } {
    let triangles = 0;
    let meshes = 0;
    const materialSet = new Set<THREE.Material>();
    const textureSet = new Set<THREE.Texture>();

    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        meshes++;
        const mesh = child as THREE.Mesh;
        const geometry = mesh.geometry;

        if (geometry) {
          if (geometry.index) {
            triangles += geometry.index.count / 3;
          } else if (geometry.attributes.position) {
            triangles += geometry.attributes.position.count / 3;
          }
        }

        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        for (const mat of materials) {
          if (mat) {
            materialSet.add(mat);
            const standardMat = mat as THREE.MeshStandardMaterial;
            if (standardMat.map) textureSet.add(standardMat.map);
            if (standardMat.normalMap) textureSet.add(standardMat.normalMap);
            if (standardMat.roughnessMap) textureSet.add(standardMat.roughnessMap);
            if (standardMat.metalnessMap) textureSet.add(standardMat.metalnessMap);
            if (standardMat.aoMap) textureSet.add(standardMat.aoMap);
          }
        }
      }
    });

    return {
      triangles: Math.round(triangles),
      meshes,
      materials: materialSet.size,
      textures: textureSet.size
    };
  }
}
