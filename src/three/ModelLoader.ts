import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';

export interface ModelLoadCallbacks {
  onProgress?: (percent: number) => void;
  onSuccess?: (scene: THREE.Group) => void;
  onError?: (err: Error) => void;
}

export class ModelLoader {
  private loader: GLTFLoader;

  constructor() {
    this.loader = new GLTFLoader();
  }

  public load(url: string, callbacks: ModelLoadCallbacks = {}): Promise<THREE.Group> {
    return new Promise((resolve, reject) => {
      this.loader.load(
        url,
        (gltf) => {
          if (callbacks.onProgress) callbacks.onProgress(100);
          if (callbacks.onSuccess) callbacks.onSuccess(gltf.scene);
          resolve(gltf.scene);
        },
        (xhr) => {
          if (xhr.lengthComputable && xhr.total > 0) {
            const percent = Math.min(99, Math.round((xhr.loaded / xhr.total) * 100));
            if (callbacks.onProgress) callbacks.onProgress(percent);
          }
        },
        (error) => {
          const err = error instanceof Error ? error : new Error(String(error));
          console.error(`Failed to load 3D model from ${url}:`, err);
          if (callbacks.onError) callbacks.onError(err);
          reject(err);
        }
      );
    });
  }
}
