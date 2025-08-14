import * as THREE from 'three';
import type { Coordinate } from '../models';
import { CameraConstants } from './camera-constants';
import { type CameraConfig, CameraController } from './camera-controller';
import { PerspectiveZoomStrategy, type ZoomConfig } from './zoom-strategy';

export interface PerspectiveCameraConfig extends CameraConfig {
  fov: number;
}

export class PerspectiveCameraController extends CameraController<
  THREE.PerspectiveCamera,
  PerspectiveCameraConfig
> {
  private readonly zoomStrategy: PerspectiveZoomStrategy;
  private cachedFovTan: number;

  constructor(
    cameraConfig: PerspectiveCameraConfig,
    zoomConfig: ZoomConfig,
    initialConfig: PerspectiveCameraConfig
  ) {
    super(cameraConfig, zoomConfig, initialConfig);

    const fovRadians = (this.camera.fov * Math.PI) / 180;
    this.cachedFovTan = Math.tan(fovRadians / 2);
    this.zoomStrategy = new PerspectiveZoomStrategy(zoomConfig, this.cachedFovTan);
  }

  protected createCamera(config: PerspectiveCameraConfig): THREE.PerspectiveCamera {
    return new THREE.PerspectiveCamera(config.fov, config.aspect, config.near, config.far);
  }

  protected handleWheel(event: WheelEvent): void {
    // Calculate current distance from origin
    const currentDistance = Math.sqrt(
      this.camera.position.x ** 2 + this.camera.position.y ** 2 + this.camera.position.z ** 2
    );

    const {
      newValue: newDistance,
      zoomRatio,
      worldPosition,
    } = this.zoomStrategy.calculateZoom(event, currentDistance, this.camera.aspect);

    // Calculate new camera position by scaling the current position vector
    // This maintains the camera direction while adjusting distance
    const distanceRatio = newDistance / currentDistance;

    // Scale the camera position to new distance
    const newCameraX = this.camera.position.x * distanceRatio;
    const newCameraY = this.camera.position.y * distanceRatio;
    const newCameraZ = this.camera.position.z * distanceRatio;

    // Adjust camera position to zoom towards mouse position
    // The world position is calculated at the current distance, so we need to adjust it
    const adjustmentX = worldPosition.x * (1 - zoomRatio);
    const adjustmentY = worldPosition.y * (1 - zoomRatio);

    this.camera.position.x = newCameraX + adjustmentX;
    this.camera.position.y = newCameraY + adjustmentY;
    this.camera.position.z = newCameraZ;

    // Dynamically adjust near clipping plane based on camera distance
    this.updateNearClippingPlane();

    // Update rotation center scale if it's visible
    this.updateRotationCenterScaleCallback?.();

    this.eventHandler.triggerRender();
  }

  private updateNearClippingPlane(): void {
    const distance = this.camera.position.distanceTo(this.screenCenterWorld);

    const newNear = Math.max(
      CameraConstants.PERSPECTIVE_MIN_NEAR,
      distance * CameraConstants.PERSPECTIVE_NEAR_FACTOR
    );
    const newFar = Math.max(
      CameraConstants.PERSPECTIVE_FAR_MIN,
      distance * CameraConstants.PERSPECTIVE_FAR_FACTOR
    );

    this.camera.near = newNear;
    this.camera.far = newFar;
    this.camera.updateProjectionMatrix();
  }

  protected handleResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  }

  protected handlePlanarMovement(deltaX: number, deltaY: number, startPos: Coordinate): void {
    // Calculate proper sensitivity for perspective camera using cached values
    const distance = this.camera.position.z;
    const height = 2 * this.cachedFovTan * distance;
    const width = height * this.camera.aspect;

    const sensitivityX = width / window.innerWidth;
    const sensitivityY = height / window.innerHeight;

    // Set camera position directly based on initial position plus mouse delta
    this.camera.position.x = startPos.x - deltaX * sensitivityX;
    this.camera.position.y = startPos.y + deltaY * sensitivityY;

    // Update screen center after camera movement
    this.updateScreenCenterWorld();
  }

  protected handleDepthMovement(deltaY: number, startPos: Coordinate): void {
    const newZ = Math.max(
      CameraConstants.MIN_CAMERA_DISTANCE,
      startPos.z + deltaY * CameraConstants.DEPTH_SENSITIVITY
    );
    this.camera.position.z = newZ;

    this.updateScreenCenterWorld();
    this.updateNearClippingPlane();
  }

  updateInitialConfig(newConfig: PerspectiveCameraConfig): void {
    super.updateInitialConfig(newConfig);
    const fovRadians = (newConfig.fov * Math.PI) / 180;
    this.cachedFovTan = Math.tan(fovRadians / 2);
  }

  protected onResetFinalized(): void {
    this.camera.fov = this.initialConfig.fov;
    this.camera.aspect = this.initialConfig.aspect;
    this.camera.near = this.initialConfig.near;
    this.camera.far = this.initialConfig.far;

    const fovRadians = (this.camera.fov * Math.PI) / 180;
    this.cachedFovTan = Math.tan(fovRadians / 2);

    this.updateScreenCenterWorld();
    this.updateNearClippingPlane();
    this.hideRotationCenterCallback?.();
    this.eventHandler.triggerRender();
  }

  protected onRotationComplete(): void {
    this.updateNearClippingPlane();
    super.onRotationComplete();
  }

  getCurrentDistance(): number {
    return this.camera.position.length();
  }

  protected updateProjectionMatrix(): void {
    this.camera.updateProjectionMatrix();
  }
}
