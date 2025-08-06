import * as THREE from 'three';
import { CameraEventHandler } from './camera-event-handler';
import { PerspectiveZoomStrategy, type ZoomConfig } from './zoom-strategy';

export interface PerspectiveCameraConfig {
  fov: number;
  aspect: number;
  near: number;
  far: number;
  position: { x: number; y: number; z: number };
}

export class PerspectiveCameraController {
  public readonly camera: THREE.PerspectiveCamera;
  private readonly zoomStrategy: PerspectiveZoomStrategy;
  private readonly eventHandler: CameraEventHandler;

  // Performance optimization: cache expensive calculations
  private cachedFovTan: number;

  // Store initial camera configuration for reset
  private initialConfig: PerspectiveCameraConfig;

  // Rotation center callbacks
  private showRotationCenterCallback?: (position: THREE.Vector3) => void;
  private hideRotationCenterCallback?: () => void;
  private updateRotationCenterScaleCallback?: () => void;

  // Track spherical coordinates for screen-center rotation
  private sphericalPhi = 0; // azimuthal angle (horizontal rotation)
  private sphericalTheta = Math.PI / 2; // polar angle (vertical rotation)

  // Track the current screen center in world coordinates for rotation
  private screenCenterWorld = new THREE.Vector3();

  constructor(cameraConfig: PerspectiveCameraConfig, zoomConfig: ZoomConfig) {
    // Store initial configuration for reset functionality
    this.initialConfig = { ...cameraConfig };

    this.camera = new THREE.PerspectiveCamera(
      cameraConfig.fov,
      cameraConfig.aspect,
      cameraConfig.near,
      cameraConfig.far
    );

    this.camera.position.set(
      cameraConfig.position.x,
      cameraConfig.position.y,
      cameraConfig.position.z
    );

    // Look at origin to ensure proper initial orientation
    this.camera.lookAt(0, 0, 0);

    // Cache expensive trigonometric calculation
    const fovRadians = (this.camera.fov * Math.PI) / 180;
    this.cachedFovTan = Math.tan(fovRadians / 2);

    this.camera.updateProjectionMatrix();

    // Initialize screen center and spherical coordinates
    this.updateScreenCenterWorld();
    this.initializeSphericalCoordinates();

    // Create zoom strategy and event handler
    this.zoomStrategy = new PerspectiveZoomStrategy(zoomConfig, this.cachedFovTan);
    this.eventHandler = new CameraEventHandler(
      this.handleWheel.bind(this),
      this.handleResize.bind(this),
      this.handleMouseMove.bind(this),
      this.handleMouseDown.bind(this),
      () => this.hideRotationCenterCallback?.(),
      this.resetCamera.bind(this)
    );
  }

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

  private handleWheel(event: WheelEvent): void {
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
    // Calculate distance from screen center
    const distance = this.camera.position.distanceTo(this.screenCenterWorld);

    // Very aggressive near plane - objects can be very close to screen center
    const newNear = Math.max(0.001, distance * 0.01);

    // Far plane should be much further than camera distance
    const newFar = Math.max(1000, distance * 10);

    this.camera.near = newNear;
    this.camera.far = newFar;

    this.camera.updateProjectionMatrix();
  }

  private handleResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  }

  private handleMouseDown(event: MouseEvent): void {
    this.eventHandler.setDragStartCameraPosition(
      this.camera.position.x,
      this.camera.position.y,
      this.camera.position.z
    );

    // For rotation, update screen center and spherical coordinates
    if (event.ctrlKey) {
      this.updateScreenCenterWorld();
      this.updateSphericalCoordinatesFromCurrentPosition();

      // Show rotation center indicator
      if (this.showRotationCenterCallback) {
        this.showRotationCenterCallback(this.screenCenterWorld);
      }
    }

    // Store current spherical coordinates for rotation
    this.eventHandler.setDragStartCameraRotation(this.sphericalPhi, this.sphericalTheta);
  }

  private handleMouseMove(
    deltaX: number,
    deltaY: number,
    startPos: { x: number; y: number; z: number },
    startRotation: { x: number; y: number },
    isShiftPressed: boolean,
    isCtrlPressed: boolean
  ): void {
    if (isShiftPressed) {
      // Shift + mouse: depth movement
      this.handleDepthMovement(deltaY, startPos);
    } else if (isCtrlPressed) {
      // Ctrl + mouse: rotation around screen center
      this.handleRotation(deltaX, deltaY, startRotation);
    } else {
      // Normal mouse: planar movement
      this.handlePlanarMovement(deltaX, deltaY, startPos);
    }
  }

  private handlePlanarMovement(
    deltaX: number,
    deltaY: number,
    startPos: { x: number; y: number; z: number }
  ): void {
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

  private handleDepthMovement(deltaY: number, startPos: { x: number; y: number; z: number }): void {
    // Depth movement (Z-axis) with up/down mouse movement
    const depthSensitivity = 0.02;
    const newZ = Math.max(0.1, startPos.z + deltaY * depthSensitivity);
    this.camera.position.z = newZ;

    // Update screen center after camera movement
    this.updateScreenCenterWorld();

    // Update near clipping plane when depth changes
    this.updateNearClippingPlane();
  }

  private handleRotation(
    deltaX: number,
    deltaY: number,
    startRotation: { x: number; y: number }
  ): void {
    const rotationSensitivity = 0.005;
    const maxTheta = Math.PI * 0.95; // Prevent flipping (5% margin from poles)
    const minTheta = Math.PI * 0.05;

    // Calculate new spherical coordinates from start position + delta
    this.sphericalPhi = startRotation.x + deltaX * rotationSensitivity;
    this.sphericalTheta = Math.max(
      minTheta,
      Math.min(maxTheta, startRotation.y - deltaY * rotationSensitivity)
    );

    // Get current distance from screen center
    const distance = this.camera.position.distanceTo(this.screenCenterWorld);

    // Convert spherical coordinates to Cartesian position relative to screen center
    this.camera.position.x =
      this.screenCenterWorld.x +
      distance * Math.sin(this.sphericalTheta) * Math.cos(this.sphericalPhi);
    this.camera.position.y = this.screenCenterWorld.y + distance * Math.cos(this.sphericalTheta);
    this.camera.position.z =
      this.screenCenterWorld.z +
      distance * Math.sin(this.sphericalTheta) * Math.sin(this.sphericalPhi);

    // Look at the screen center
    this.camera.lookAt(this.screenCenterWorld);

    // Update near clipping plane when rotation changes
    this.updateNearClippingPlane();
  }

  getCurrentDistance(): number {
    return this.camera.position.z;
  }

  updateInitialConfig(newConfig: PerspectiveCameraConfig): void {
    // Update the initial configuration for reset functionality
    this.initialConfig.position = { ...newConfig.position };
    this.initialConfig.fov = newConfig.fov;
    this.initialConfig.aspect = newConfig.aspect;
    this.initialConfig.near = newConfig.near;
    this.initialConfig.far = newConfig.far;
  }

  private isLookingAtOrigin(): boolean {
    // Check if camera is already looking at origin by comparing screen center to origin
    this.updateScreenCenterWorld();
    const distanceToOrigin = this.screenCenterWorld.length();
    const tolerance = 0.1; // Small tolerance for floating point comparison
    return distanceToOrigin < tolerance;
  }

  private resetCameraToPanToOrigin(): void {
    console.log('[CAMERA_RESET] Stage 1: Moving pan position to origin');

    // Calculate current camera direction
    const currentDirection = new THREE.Vector3();
    this.camera.getWorldDirection(currentDirection);

    // Calculate current distance from screen center
    const currentDistance = this.camera.position.distanceTo(this.screenCenterWorld);

    // Set new camera position to look at origin from same angle and distance
    this.camera.position.copy(currentDirection.clone().multiplyScalar(-currentDistance));

    // Make camera look at origin
    this.camera.lookAt(0, 0, 0);

    console.log('[CAMERA_RESET] Stage 1 complete: Moved to look at origin');
  }

  private resetCameraToInitialState(): void {
    console.log('[CAMERA_RESET] Stage 2: Resetting camera angle to initial state');

    // Reset position
    this.camera.position.set(
      this.initialConfig.position.x,
      this.initialConfig.position.y,
      this.initialConfig.position.z
    );

    // Reset camera parameters
    this.camera.fov = this.initialConfig.fov;
    this.camera.aspect = this.initialConfig.aspect;
    this.camera.near = this.initialConfig.near;
    this.camera.far = this.initialConfig.far;

    // Reset rotation (look at origin)
    this.camera.lookAt(0, 0, 0);

    // Recalculate cached values
    const fovRadians = (this.camera.fov * Math.PI) / 180;
    this.cachedFovTan = Math.tan(fovRadians / 2);

    console.log('[CAMERA_RESET] Stage 2 complete: Full reset to initial state');
  }

  private finalizeReset(): void {
    // Update projection matrix
    this.camera.updateProjectionMatrix();

    // Update internal state
    this.updateScreenCenterWorld();
    this.initializeSphericalCoordinates();
    this.updateNearClippingPlane();

    // Hide rotation center if visible
    this.hideRotationCenterCallback?.();

    // Trigger render
    this.eventHandler.triggerRender();

    console.log('[CAMERA_RESET] Camera reset complete');
  }

  private resetCamera(): void {
    const isAlreadyLookingAtOrigin = this.isLookingAtOrigin();

    if (isAlreadyLookingAtOrigin) {
      this.resetCameraToInitialState();
    } else {
      this.resetCameraToPanToOrigin();
    }

    this.finalizeReset();
  }

  private updateScreenCenterWorld(): void {
    // For perspective camera, calculate where the camera's center ray intersects the Z=0 plane
    // If camera is looking parallel to Z=0 plane, use a default distance
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);

    // If camera is looking mostly parallel to Z=0 plane, use fixed distance
    if (Math.abs(forward.z) < 0.01) {
      this.screenCenterWorld.copy(this.camera.position);
      this.screenCenterWorld.addScaledVector(forward, 50);
    } else {
      // Calculate intersection with Z=0 plane
      const distanceToPlane = -this.camera.position.z / forward.z;
      this.screenCenterWorld.copy(this.camera.position);
      this.screenCenterWorld.addScaledVector(forward, distanceToPlane);
    }
  }

  private initializeSphericalCoordinates(): void {
    // Calculate initial spherical coordinates relative to screen center
    const relativePosition = this.camera.position.clone().sub(this.screenCenterWorld);
    const distance = relativePosition.length();

    if (distance > 0) {
      this.sphericalTheta = Math.acos(relativePosition.y / distance);
      this.sphericalPhi = Math.atan2(relativePosition.z, relativePosition.x);
    } else {
      this.sphericalTheta = Math.PI / 2;
      this.sphericalPhi = 0;
    }
  }

  private updateSphericalCoordinatesFromCurrentPosition(): void {
    // Recalculate spherical coordinates based on current camera position and screen center
    const relativePosition = this.camera.position.clone().sub(this.screenCenterWorld);
    const distance = relativePosition.length();

    if (distance > 0) {
      this.sphericalTheta = Math.acos(relativePosition.y / distance);
      this.sphericalPhi = Math.atan2(relativePosition.z, relativePosition.x);
    } else {
      this.sphericalTheta = Math.PI / 2;
      this.sphericalPhi = 0;
    }
  }

  dispose(): void {
    this.eventHandler.dispose();
  }
}
