import * as THREE from 'three';

export class RotationCenterIndicator {
  private indicator: THREE.Mesh | null = null;
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  show(position: THREE.Vector3, camera: THREE.Camera): void {
    if (!this.indicator) {
      this.createIndicator();
    }

    // Update position
    this.indicator!.position.copy(position);
    this.indicator!.visible = true;

    // Update scale based on camera distance to maintain consistent visual size
    this.updateScale(camera);
  }

  hide(): void {
    if (this.indicator) {
      this.indicator.visible = false;
    }
  }

  updateScale(camera: THREE.Camera): void {
    if (!this.indicator?.visible) return;

    // Calculate scale factor based on camera type and distance
    let scaleFactor: number;

    if (camera.type === 'OrthographicCamera') {
      // For orthographic camera, scale based on zoom level (orthographic size)
      const orthoCamera = camera as THREE.OrthographicCamera;
      const viewSize = orthoCamera.top - orthoCamera.bottom;
      scaleFactor = viewSize / 100; // Normalize to a base size
    } else {
      // For perspective camera, scale based on distance to maintain consistent screen size
      const perspCamera = camera as THREE.PerspectiveCamera;
      const distance = camera.position.distanceTo(this.indicator.position);
      const fov = (perspCamera.fov * Math.PI) / 180;
      const viewHeight = 2 * Math.tan(fov / 2) * distance;
      scaleFactor = viewHeight / 100; // Normalize to a base size
    }

    // Apply scale with minimum and maximum bounds
    const minScale = 0.1;
    const maxScale = 5;
    const finalScale = Math.max(minScale, Math.min(maxScale, scaleFactor));

    this.indicator.scale.setScalar(finalScale);
  }

  private createIndicator(): void {
    // Create a small sphere to indicate the rotation center
    const geometry = new THREE.SphereGeometry(0.5, 8, 8);
    const material = new THREE.MeshBasicMaterial({
      color: 0xff6b6b,
      transparent: true,
      opacity: 0.8,
      depthTest: false, // Always visible on top
    });

    this.indicator = new THREE.Mesh(geometry, material);
    this.indicator.renderOrder = 1000; // Render on top
    this.scene.add(this.indicator);
  }

  dispose(): void {
    if (this.indicator) {
      this.scene.remove(this.indicator);
      this.indicator.geometry.dispose();
      (this.indicator.material as THREE.Material).dispose();
      this.indicator = null;
    }
  }
}
