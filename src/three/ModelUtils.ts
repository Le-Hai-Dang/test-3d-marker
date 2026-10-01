import * as THREE from 'three';

export interface ModelBoundsInfo {
  box: THREE.Box3;
  size: THREE.Vector3;
  center: THREE.Vector3;
  minY: number;
  localWidth: number;
  localHeight: number;
  localDepth: number;
}

export class ModelUtils {
  /**
   * Computes the bounding box of the model hierarchy.
   */
  public static computeBounds(root: THREE.Object3D): ModelBoundsInfo {
    const box = new THREE.Box3().setFromObject(root);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    return {
      box,
      size,
      center,
      minY: box.min.y,
      localWidth: size.x,
      localHeight: size.y,
      localDepth: size.z
    };
  }

  /**
   * Aligns the model so that:
   * 1. Ground plane (lowest point) sits exactly at local Y = 0.
   * 2. X and Z are centered around local (0, 0) for natural rotation.
   */
  public static groundAlignAndCenter(root: THREE.Object3D): ModelBoundsInfo {
    const bounds = this.computeBounds(root);

    // Offset root children so that center X=0, center Z=0, and min Y=0
    root.position.x = -bounds.center.x;
    root.position.y = -bounds.minY;
    root.position.z = -bounds.center.z;

    // Wrap in an alignment pivot group
    const pivot = new THREE.Group();
    pivot.name = 'aligned_pivot';
    pivot.add(root);

    // Re-verify bounds of the aligned pivot
    const alignedBounds = this.computeBounds(pivot);
    return alignedBounds;
  }

  /**
   * Configures materials for optimal PBR shading in GIS scene.
   * Stores original material properties for hover restoration.
   */
  public static configureMaterials(root: THREE.Object3D): Map<THREE.Mesh, {
    emissive: THREE.Color;
    emissiveIntensity: number;
  }> {
    const originalStates = new Map<THREE.Mesh, { emissive: THREE.Color; emissiveIntensity: number }>();

    root.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

        for (const mat of materials) {
          if (mat && (mat as THREE.MeshStandardMaterial).isMeshStandardMaterial) {
            const stdMat = mat as THREE.MeshStandardMaterial;
            // Logistics terminals (concrete pavement, paint, containers) are dielectric.
            // Low metalness provides rich diffuse response and deep, crisp shadows.
            stdMat.metalness = 0.05;
            stdMat.roughness = Math.max(0.65, stdMat.roughness);
            stdMat.toneMapped = true;
            stdMat.shadowSide = THREE.DoubleSide;

            if (stdMat.map) {
              stdMat.map.colorSpace = THREE.SRGBColorSpace;
              stdMat.map.needsUpdate = true;
            }

            originalStates.set(mesh, {
              emissive: stdMat.emissive ? stdMat.emissive.clone() : new THREE.Color(0x000000),
              emissiveIntensity: stdMat.emissiveIntensity ?? 0
            });
          }
        }
      }
    });

    return originalStates;
  }
}
