import * as THREE from 'three';
import type { Coordinate } from '../models';
import { CameraEventHandler } from './camera-event-handler';
import { CameraReset } from './camera-reset';
import { MouseMovementHandler, type MovementHandlers } from './mouse-movement-handler';
import { calculateScreenCenterWorld } from './screen-center-calculator';
import { SphericalCoordinates } from './spherical-coordinates';
import type { ZoomConfig } from './zoom-strategy';

export interface CameraConfig {
  position: Coordinate;
  aspect: number;
  near: number;
  far: number;
}

export abstract class CameraController<TCamera extends THREE.Camera, TConfig extends CameraConfig> {
  public readonly camera: TCamera;
  protected readonly eventHandler: CameraEventHandler;
  protected readonly sphericalCoords: SphericalCoordinates;
  protected readonly cameraReset: CameraReset;
  protected readonly mouseMovementHandler: MouseMovementHandler;

  // Callbacks
  protected showRotationCenterCallback?: (position: THREE.Vector3) => void;
  protected hideRotationCenterCallback?: () => void;
  protected updateRotationCenterScaleCallback?: () => void;

  protected screenCenterWorld = new THREE.Vector3();
  protected initialConfig: TConfig;

  constructor(cameraConfig: TConfig, _zoomConfig: ZoomConfig) {
    this.initialConfig = { ...cameraConfig };
    this.camera = this.createCamera(cameraConfig);
    this.setupInitialPosition(cameraConfig);

    // Initialize screen center and spherical coordinates
    this.updateScreenCenterWorld();
    this.sphericalCoords = new SphericalCoordinates(this.screenCenterWorld, this.camera.position);

    // Initialize reset functionality
    this.cameraReset = new CameraReset(
      this.camera,
      { position: this.initialConfig.position },
      this.onResetFinalized.bind(this),
      () => this.eventHandler.stopRotation()
    );

    // Initialize mouse movement handler
    const movementHandlers: MovementHandlers = {
      handlePlanar: this.handlePlanarMovement.bind(this),
      handleDepth: this.handleDepthMovement.bind(this),
      handleRotation: this.handleRotation.bind(this),
    };
    this.mouseMovementHandler = new MouseMovementHandler(movementHandlers);

    // Create event handler
    this.eventHandler = new CameraEventHandler(
      this.handleWheel.bind(this),
      this.handleResize.bind(this),
      this.handleMouseMove.bind(this),
      this.handleMouseDown.bind(this),
      () => this.hideRotationCenterCallback?.(),
      this.resetCamera.bind(this)
    );
  }

  // Abstract methods to be implemented by subclasses
  protected abstract createCamera(config: TConfig): TCamera;
  protected abstract handleWheel(event: WheelEvent): void;
  protected abstract handleResize(): void;
  protected abstract handlePlanarMovement(
    deltaX: number,
    deltaY: number,
    startPos: Coordinate
  ): void;
  protected abstract handleDepthMovement(deltaY: number, startPos: Coordinate): void;
  protected abstract onResetFinalized(): void;
  protected abstract updateProjectionMatrix(): void;

  // Common methods
  setRenderCallback(callback: () => void): void {
    this.eventHandler.setRenderCallback(callback);
  }

  setContinuousRenderCallback(callback: (enabled: boolean) => void): void {
    this.eventHandler.setContinuousRenderCallback(callback);
  }

  setRotationCenterCallback(
    showCallback: (position: THREE.Vector3) => void,
    hideCallback: () => void,
    updateScaleCallback?: () => void
  ): void {
    this.showRotationCenterCallback = showCallback;
    this.hideRotationCenterCallback = hideCallback;
    this.updateRotationCenterScaleCallback = updateScaleCallback;
  }

  setupEventListeners(): void {
    this.eventHandler.setupEventListeners();
  }

  protected setupInitialPosition(config: TConfig): void {
    this.camera.position.set(config.position.x, config.position.y, config.position.z);
    this.camera.lookAt(0, 0, 0);
    this.updateProjectionMatrix();
  }

  protected updateScreenCenterWorld(): void {
    this.screenCenterWorld.copy(calculateScreenCenterWorld(this.camera));
    this.sphericalCoords?.updateScreenCenter(this.screenCenterWorld);
  }

  protected handleMouseDown(event: MouseEvent): void {
    this.eventHandler.setDragStartCameraPosition(
      this.camera.position.x,
      this.camera.position.y,
      this.camera.position.z
    );

    // For rotation, update screen center and spherical coordinates
    if (event.ctrlKey) {
      this.updateScreenCenterWorld();
      this.sphericalCoords.updateFromPosition(this.camera.position);

      // Show rotation center indicator
      if (this.showRotationCenterCallback) {
        this.showRotationCenterCallback(this.screenCenterWorld);
      }
    }

    // Store current spherical coordinates for rotation
    this.eventHandler.setDragStartCameraRotation(
      this.sphericalCoords.getPhi(),
      this.sphericalCoords.getTheta()
    );
  }

  protected handleMouseMove(
    deltaX: number,
    deltaY: number,
    startPos: Coordinate,
    startRotation: { x: number; y: number },
    isShiftPressed: boolean,
    isCtrlPressed: boolean
  ): void {
    this.mouseMovementHandler.handleMouseMove(
      deltaX,
      deltaY,
      startPos,
      startRotation,
      isShiftPressed,
      isCtrlPressed
    );
  }

  protected handleRotation(
    deltaX: number,
    deltaY: number,
    startRotation: { x: number; y: number }
  ): void {
    this.sphericalCoords.calculateRotation(deltaX, deltaY, startRotation.x, startRotation.y);

    // Get current distance from screen center
    const distance = this.camera.position.distanceTo(this.screenCenterWorld);

    // Convert spherical coordinates to Cartesian position
    const newPosition = this.sphericalCoords.toCartesian(distance);
    this.camera.position.copy(newPosition);

    // Look at the screen center
    this.camera.lookAt(this.screenCenterWorld);

    this.onRotationComplete();
  }

  protected onRotationComplete(): void {
    this.updateProjectionMatrix();
  }

  protected resetCamera(): void {
    this.cameraReset.execute();
  }

  updateInitialConfig(newConfig: TConfig): void {
    this.initialConfig = { ...newConfig };
    // Update camera reset configuration as well
    this.cameraReset.updateInitialConfig({ position: this.initialConfig.position });
  }

  dispose(): void {
    this.eventHandler.dispose();
  }
}
