import * as THREE from 'three';

export class Lighting {
  public group: THREE.Group;
  public dirLight: THREE.DirectionalLight;
  public hemiLight: THREE.HemisphereLight;
  public groundShadowReceiver: THREE.Mesh;
  public shadowPlane: THREE.Mesh;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'lighting_group';

    // 1. Natural Ambient Light: Cool sky + warm ground bounce
    // Controlled intensity (0.65) so shadows remain rich and deep
    this.hemiLight = new THREE.HemisphereLight(0xbad8f8, 0x18202c, 0.65);
    this.hemiLight.position.set(0, 6, 0);
    this.group.add(this.hemiLight);

    // 2. Main Sun Directional Light:
    // Placed at (-2.2, 4.0, -2.4) so containers, crane, and trucks cast long, crisp diagonal shadows
    // across the concrete yard and onto the surrounding ground
    this.dirLight = new THREE.DirectionalLight(0xfff6ea, 3.4);
    this.dirLight.position.set(-2.2, 4.0, -2.4);

    const lightTarget = new THREE.Object3D();
    lightTarget.position.set(0, 0.1, 0);
    this.group.add(lightTarget);
    this.dirLight.target = lightTarget;

    // High-resolution shadow map (2048 x 2048)
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 0.5;
    this.dirLight.shadow.camera.far = 12.0;

    // Tight shadow frustum framing model (W: 1.68m, D: 1.90m, H: 0.58m)
    const frustum = 2.0;
    this.dirLight.shadow.camera.left = -frustum;
    this.dirLight.shadow.camera.right = frustum;
    this.dirLight.shadow.camera.top = frustum;
    this.dirLight.shadow.camera.bottom = -frustum;
    this.dirLight.shadow.camera.updateProjectionMatrix();

    this.dirLight.shadow.bias = -0.0001;
    this.dirLight.shadow.normalBias = 0.006;

    this.group.add(this.dirLight);

    // 3. Subtle secondary fill light (low intensity so it doesn't wash out shadows)
    const fillLight = new THREE.DirectionalLight(0x5a88ba, 0.25);
    fillLight.position.set(3.5, 2.5, 2.5);
    this.group.add(fillLight);

    // 4. Directional Shadow Receiver Plane:
    // Uses transparent ShadowMaterial so the model's cast shadow darkens the basemap directly,
    // with NO artificial solid borders or gray squares
    const groundShadowGeo = new THREE.PlaneGeometry(5.0, 5.0);
    const groundShadowMat = new THREE.ShadowMaterial({
      opacity: 0.78,
      depthWrite: false
    });
    this.groundShadowReceiver = new THREE.Mesh(groundShadowGeo, groundShadowMat);
    this.groundShadowReceiver.rotation.x = -Math.PI / 2;
    this.groundShadowReceiver.position.y = 0.001;
    this.groundShadowReceiver.receiveShadow = true;
    this.groundShadowReceiver.name = 'ground_directional_shadow';
    this.group.add(this.groundShadowReceiver);

    // 5. Perimeter Ambient Occlusion Shadow:
    // Soft radial drop shadow that smoothly grounds the foundation slab into the surrounding streets
    this.shadowPlane = this.createPerimeterAoShadow(2.6, 2.8);
    this.group.add(this.shadowPlane);
  }

  private createPerimeterAoShadow(width: number, height: number): THREE.Mesh {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, 512, 512);

    // Radial gradient with ultra-smooth falloff (no hard edges)
    const grad = ctx.createRadialGradient(256, 256, 120, 256, 256, 250);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
    grad.addColorStop(0.4, 'rgba(0, 0, 0, 0.55)');
    grad.addColorStop(0.8, 'rgba(0, 0, 0, 0.15)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    const texture = new THREE.CanvasTexture(canvas);
    texture.generateMipmaps = true;

    const geometry = new THREE.PlaneGeometry(width, height);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      opacity: 0.85
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.0005;
    mesh.name = 'perimeter_ao_shadow';
    return mesh;
  }
}
