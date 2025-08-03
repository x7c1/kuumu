import type * as THREE from 'three';
import type { CameraConfig } from './camera-controller/index';

export function calculateCurrentVisualSize(camera: THREE.Camera, position: THREE.Vector3): number {
  if (camera.type === 'OrthographicCamera') {
    const orthoCamera = camera as THREE.OrthographicCamera;
    const visualSize = orthoCamera.top - orthoCamera.bottom;
    return visualSize;
  } else {
    const perspCamera = camera as THREE.PerspectiveCamera;
    const fovRadians = (perspCamera.fov * Math.PI) / 180;
    const visualSize = 2 * Math.tan(fovRadians / 2) * position.z;
    return visualSize;
  }
}

export function createPerspectiveConfig(
  _visualSize: number,
  _distance: number
): Partial<CameraConfig> {
  // Use a standard FOV for more natural perspective
  const standardFov = 50; // Standard human-like field of view

  return {
    fov: standardFov,
    size: undefined,
  };
}

export function createOrthographicConfig(visualSize: number): Partial<CameraConfig> {
  const newOrthographicSize = visualSize;

  return {
    size: newOrthographicSize,
    fov: undefined,
  };
}
