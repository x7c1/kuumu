import * as THREE from 'three';
import { CameraConstants } from './camera-constants';

export class SphericalCoordinates {
  private phi = 0; // azimuthal angle (horizontal rotation)
  private theta = Math.PI / 2; // polar angle (vertical rotation)

  constructor(
    private screenCenter: THREE.Vector3,
    cameraPosition: THREE.Vector3
  ) {
    this.updateFromPosition(cameraPosition);
  }

  updateFromPosition(cameraPosition: THREE.Vector3): void {
    const relativePosition = cameraPosition.clone().sub(this.screenCenter);
    const distance = relativePosition.length();

    if (distance > 0) {
      this.theta = Math.acos(relativePosition.y / distance);
      this.phi = Math.atan2(relativePosition.z, relativePosition.x);
    } else {
      this.theta = Math.PI / 2;
      this.phi = 0;
    }
  }

  updateScreenCenter(newScreenCenter: THREE.Vector3): void {
    this.screenCenter.copy(newScreenCenter);
  }

  calculateRotation(
    deltaX: number,
    deltaY: number,
    startPhi: number,
    startTheta: number
  ): { phi: number; theta: number } {
    const newPhi = startPhi + deltaX * CameraConstants.ROTATION_SENSITIVITY;
    const newTheta = Math.max(
      CameraConstants.MIN_THETA,
      Math.min(
        CameraConstants.MAX_THETA,
        startTheta - deltaY * CameraConstants.ROTATION_SENSITIVITY
      )
    );

    this.phi = newPhi;
    this.theta = newTheta;

    return { phi: this.phi, theta: this.theta };
  }

  toCartesian(distance: number): THREE.Vector3 {
    const position = new THREE.Vector3();

    position.x =
      this.screenCenter.x +
      distance * Math.sin(this.theta) * Math.cos(this.phi);
    position.y =
      this.screenCenter.y +
      distance * Math.cos(this.theta);
    position.z =
      this.screenCenter.z +
      distance * Math.sin(this.theta) * Math.sin(this.phi);

    return position;
  }

  getPhi(): number {
    return this.phi;
  }

  getTheta(): number {
    return this.theta;
  }

  getScreenCenter(): THREE.Vector3 {
    return this.screenCenter.clone();
  }
}
