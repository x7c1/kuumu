import * as THREE from 'three';
import { CameraConstants } from './camera-constants';
import { calculateScreenCenterWorld } from './screen-center-calculator';

interface Position {
  x: number;
  y: number;
  z: number;
}

interface CameraResetConfig {
  position: Position;
}

export class CameraReset {
  constructor(
    private camera: THREE.Camera,
    private initialConfig: CameraResetConfig,
    private onReset: () => void,
    private stopRotationCallback: () => void
  ) {}

  isLookingAtOrigin(): boolean {
    const screenCenter = calculateScreenCenterWorld(this.camera);
    const distanceToOrigin = screenCenter.length();
    return distanceToOrigin < CameraConstants.TOLERANCE;
  }

  resetToPanToOrigin(): void {
    console.log('[CAMERA_RESET] Stage 1: Moving pan position to origin');

    const currentDirection = new THREE.Vector3();
    this.camera.getWorldDirection(currentDirection);

    const screenCenter = calculateScreenCenterWorld(this.camera);
    const currentDistance = this.camera.position.distanceTo(screenCenter);

    // Set new camera position to look at origin from same angle and distance
    this.camera.position.copy(currentDirection.clone().multiplyScalar(-currentDistance));
    this.camera.lookAt(0, 0, 0);

    console.log('[CAMERA_RESET] Stage 1 complete: Moved to look at origin');
  }

  resetToInitialState(): void {
    console.log('[CAMERA_RESET] Stage 2: Resetting camera to initial state');

    // Reset position
    this.camera.position.set(
      this.initialConfig.position.x,
      this.initialConfig.position.y,
      this.initialConfig.position.z
    );

    // Reset rotation (look at origin)
    this.camera.lookAt(0, 0, 0);

    // Stop any ongoing rotation to clear rotation state
    this.stopRotationCallback();

    console.log('[CAMERA_RESET] Stage 2 complete: Full reset to initial state');
  }

  execute(): void {
    console.log('[CAMERA_RESET] Execute called');
    console.log('[CAMERA_RESET] Current camera position:', this.camera.position);
    console.log('[CAMERA_RESET] Initial config position:', this.initialConfig.position);

    const isAlreadyLookingAtOrigin = this.isLookingAtOrigin();
    console.log('[CAMERA_RESET] Is looking at origin:', isAlreadyLookingAtOrigin);

    if (isAlreadyLookingAtOrigin) {
      this.resetToInitialState();
    } else {
      this.resetToPanToOrigin();
    }

    // Call finalization callback
    this.onReset();

    console.log('[CAMERA_RESET] Camera reset complete, new position:', this.camera.position);
  }

  updateInitialConfig(newConfig: CameraResetConfig): void {
    this.initialConfig = { ...newConfig };
    console.log('[CAMERA_RESET] Initial config updated:', this.initialConfig);
  }
}
