import * as THREE from 'three';
import type { Coordinate } from '../models';
import { CameraConstants } from './camera-constants';
import { type CameraConfig, CameraController } from './camera-controller';
import { MouseMovementHandler } from './mouse-movement-handler';
import { OrthographicZoomStrategy, type ZoomConfig } from './zoom-strategy';

export interface OrthographicCameraConfig extends CameraConfig {
  size: number;
}

export class OrthographicCameraController extends CameraController<
  THREE.OrthographicCamera,
  OrthographicCameraConfig
> {
  private readonly aspect: number;
  private readonly zoomStrategy: OrthographicZoomStrategy;
  private cachedSize: number;

  constructor(cameraConfig: OrthographicCameraConfig, zoomConfig: ZoomConfig) {
    super(cameraConfig, zoomConfig);
    this.aspect = cameraConfig.aspect;
    this.cachedSize = cameraConfig.size;
    this.zoomStrategy = new OrthographicZoomStrategy(zoomConfig);

    this.updateOrthographicBounds();
    this.updateNearFarPlanes();
  }

  protected createCamera(config: OrthographicCameraConfig): THREE.OrthographicCamera {
    return new THREE.OrthographicCamera(
      (-config.size * config.aspect) / 2,
      (config.size * config.aspect) / 2,
      config.size / 2,
      -config.size / 2,
      config.near,
      config.far
    );
  }

  protected handleWheel(event: WheelEvent): void {
    const {
      newValue: newSize,
      zoomRatio,
      worldPosition,
    } = this.zoomStrategy.calculateZoom(event, this.cachedSize, this.aspect);

    // Adjust camera position to zoom towards mouse position
    // The world position should remain fixed in world space during zoom
    const adjustmentX = worldPosition.x * (1 - zoomRatio);
    const adjustmentY = worldPosition.y * (1 - zoomRatio);

    this.camera.position.x += adjustmentX;
    this.camera.position.y += adjustmentY;

    // Update orthographic camera properties
    this.cachedSize = newSize;
    this.camera.left = (-newSize * this.aspect) / 2;
    this.camera.right = (newSize * this.aspect) / 2;
    this.camera.top = newSize / 2;
    this.camera.bottom = -newSize / 2;
    this.camera.updateProjectionMatrix();

    // Update rotation center scale if it's visible
    this.updateRotationCenterScaleCallback?.();

    this.eventHandler.triggerRender();
  }

  protected handleResize(): void {
    const newAspect = window.innerWidth / window.innerHeight;
    const size = this.cachedSize;
    this.camera.left = (-size * newAspect) / 2;
    this.camera.right = (size * newAspect) / 2;
    this.camera.top = size / 2;
    this.camera.bottom = -size / 2;
    this.camera.updateProjectionMatrix();
  }

  protected handlePlanarMovement(deltaX: number, deltaY: number, startPos: Coordinate): void {
    // Calculate proper sensitivity for orthographic camera
    const width = this.cachedSize * this.aspect;
    const height = this.cachedSize;

    const { x: finalSensitivityX, y: finalSensitivityY } =
      MouseMovementHandler.calculatePlanarSensitivity(
        width,
        height,
        window.innerWidth,
        window.innerHeight
      );

    // Set camera position directly based on initial position plus mouse delta
    this.camera.position.x = startPos.x - deltaX * finalSensitivityX;
    this.camera.position.y = startPos.y + deltaY * finalSensitivityY;

    // Update screen center after camera movement
    this.updateScreenCenterWorld();

    // Update near/far planes after movement
    this.updateNearFarPlanes();
  }

  protected handleDepthMovement(deltaY: number, startPos: Coordinate): void {
    const newZ = Math.max(
      CameraConstants.MIN_CAMERA_DISTANCE,
      startPos.z + deltaY * CameraConstants.DEPTH_SENSITIVITY
    );
    this.camera.position.z = newZ;

    this.updateScreenCenterWorld();
    this.updateNearFarPlanes();
  }

  updateInitialConfig(newConfig: OrthographicCameraConfig): void {
    super.updateInitialConfig(newConfig);
    this.cachedSize = newConfig.size;
  }

  private updateNearFarPlanes(): void {
    this.camera.near = CameraConstants.ORTHOGRAPHIC_NEAR;
    this.camera.far = CameraConstants.ORTHOGRAPHIC_FAR;
    this.camera.updateProjectionMatrix();
  }

  protected onResetFinalized(): void {
    this.cachedSize = this.initialConfig.size;
    this.updateOrthographicBounds();
    this.updateNearFarPlanes();
    this.updateScreenCenterWorld();
    this.hideRotationCenterCallback?.();
    this.eventHandler.triggerRender();
  }

  protected onRotationComplete(): void {
    this.updateOrthographicBounds();
    this.updateNearFarPlanes();
    super.onRotationComplete();
  }

  private updateOrthographicBounds(): void {
    const size = this.cachedSize;
    this.camera.left = (-size * this.aspect) / 2;
    this.camera.right = (size * this.aspect) / 2;
    this.camera.top = size / 2;
    this.camera.bottom = -size / 2;
  }

  getCurrentSize(): number {
    // Get the actual size from the camera's current bounds
    return this.camera.top - this.camera.bottom;
  }

  protected updateProjectionMatrix(): void {
    this.camera.updateProjectionMatrix();
  }
}
