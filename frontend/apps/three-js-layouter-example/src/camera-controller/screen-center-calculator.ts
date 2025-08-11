import * as THREE from 'three';
import { CameraConstants } from './camera-constants';

export function calculateScreenCenterWorld(camera: THREE.Camera): THREE.Vector3 {
  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward);
  const screenCenterWorld = new THREE.Vector3();

  // If camera is looking mostly parallel to Z=0 plane, use fixed distance
  if (Math.abs(forward.z) < CameraConstants.PARALLEL_THRESHOLD) {
    screenCenterWorld.copy(camera.position);
    screenCenterWorld.addScaledVector(forward, CameraConstants.DEFAULT_DISTANCE);
  } else {
    // Calculate intersection with Z=0 plane
    const distanceToPlane = -camera.position.z / forward.z;
    screenCenterWorld.copy(camera.position);
    screenCenterWorld.addScaledVector(forward, distanceToPlane);
  }

  return screenCenterWorld;
}
