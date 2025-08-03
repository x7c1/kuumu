import * as THREE from 'three';
import { CameraEventHandler } from './camera-event-handler';
import { OrthographicZoomStrategy, type ZoomConfig } from './zoom-strategy';

export interface OrthographicCameraConfig {
  size: number;
  aspect: number;
  near: number;
  far: number;
  position: { x: number; y: number; z: number };
}

export class OrthographicCameraController {
  public readonly camera: THREE.OrthographicCamera;
  private readonly aspect: number;
  private readonly zoomStrategy: OrthographicZoomStrategy;
  private readonly eventHandler: CameraEventHandler;

  // Performance optimization: cache size
  private cachedSize: number;

  // Store initial camera configuration for reset
  private initialConfig: OrthographicCameraConfig;

  // Rotation center callbacks
  private showRotationCenterCallback?: (position: THREE.Vector3) => void;
  private hideRotationCenterCallback?: () => void;
  private updateRotationCenterScaleCallback?: () => void;

  // Track spherical coordinates for screen-center rotation
  private sphericalPhi = 0; // azimuthal angle (horizontal rotation)
  private sphericalTheta = Math.PI / 2; // polar angle (vertical rotation)

  // Track the current screen center in world coordinates for rotation
  private screenCenterWorld = new THREE.Vector3();

  constructor(cameraConfig: OrthographicCameraConfig, zoomConfig: ZoomConfig) {
    // Store initial configuration for reset functionality
    this.initialConfig = { ...cameraConfig };
    this.aspect = cameraConfig.aspect;
    this.cachedSize = cameraConfig.size;
    this.zoomStrategy = new OrthographicZoomStrategy(zoomConfig);

    this.camera = new THREE.OrthographicCamera(
      (-cameraConfig.size * this.aspect) / 2,
      (cameraConfig.size * this.aspect) / 2,
      cameraConfig.size / 2,
      -cameraConfig.size / 2,
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

    // Restore orthographic bounds after lookAt
    this.camera.left = (-cameraConfig.size * this.aspect) / 2;
    this.camera.right = (cameraConfig.size * this.aspect) / 2;
    this.camera.top = cameraConfig.size / 2;
    this.camera.bottom = -cameraConfig.size / 2;

    this.camera.updateProjectionMatrix();

    // Initialize screen center and spherical coordinates
    this.updateScreenCenterWorld();
    this.initializeSphericalCoordinates();

    // Update near/far planes based on rotation center
    this.updateNearFarPlanes();

    // Create event handler with camera-specific implementations
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

  private handleWheel(event: WheelEvent): void {
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

  private handleResize(): void {
    const newAspect = window.innerWidth / window.innerHeight;
    const size = this.cachedSize;
    this.camera.left = (-size * newAspect) / 2;
    this.camera.right = (size * newAspect) / 2;
    this.camera.top = size / 2;
    this.camera.bottom = -size / 2;
    this.camera.updateProjectionMatrix();
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
    // Calculate proper sensitivity for orthographic camera
    const width = this.cachedSize * this.aspect;
    const height = this.cachedSize;

    const sensitivityX = width / window.innerWidth;
    const sensitivityY = height / window.innerHeight;

    // Check for extreme sensitivity values and use fallback
    const fallbackSensitivityX = 0.01; // Reasonable fallback sensitivity
    const fallbackSensitivityY = 0.01;

    const finalSensitivityX =
      sensitivityX > 0 && sensitivityX < 1 ? sensitivityX : fallbackSensitivityX;
    const finalSensitivityY =
      sensitivityY > 0 && sensitivityY < 1 ? sensitivityY : fallbackSensitivityY;

    // Set camera position directly based on initial position plus mouse delta
    this.camera.position.x = startPos.x - deltaX * finalSensitivityX;
    this.camera.position.y = startPos.y + deltaY * finalSensitivityY;

    // Update screen center after camera movement
    this.updateScreenCenterWorld();

    // Update near/far planes after movement
    this.updateNearFarPlanes();
  }

  private handleDepthMovement(deltaY: number, startPos: { x: number; y: number; z: number }): void {
    // Depth movement (Z-axis) with up/down mouse movement
    const depthSensitivity = 0.02;
    const newZ = Math.max(0.1, startPos.z + deltaY * depthSensitivity);
    this.camera.position.z = newZ;

    // Update screen center after camera movement
    this.updateScreenCenterWorld();

    // Update near/far planes after movement
    this.updateNearFarPlanes();
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

    // CRITICAL: For orthographic camera, preserve the orthographic bounds after lookAt
    // lookAt() may interfere with orthographic projection settings
    const size = this.cachedSize;
    this.camera.left = (-size * this.aspect) / 2;
    this.camera.right = (size * this.aspect) / 2;
    this.camera.top = size / 2;
    this.camera.bottom = -size / 2;

    // Update near/far clipping planes after rotation
    this.updateNearFarPlanes();

    // Final projection matrix update
    this.camera.updateProjectionMatrix();
  }

  private updateScreenCenterWorld(): void {
    // For orthographic camera, calculate where the camera's center ray intersects the Z=0 plane
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

  getCurrentSize(): number {
    return this.cachedSize;
  }

  updateInitialConfig(newConfig: OrthographicCameraConfig): void {
    // Update the initial configuration for reset functionality
    this.initialConfig.position = { ...newConfig.position };
    this.initialConfig.size = newConfig.size;
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

    // Restore orthographic bounds after lookAt
    const size = this.cachedSize;
    this.camera.left = (-size * this.aspect) / 2;
    this.camera.right = (size * this.aspect) / 2;
    this.camera.top = size / 2;
    this.camera.bottom = -size / 2;

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

    // Reset size and orthographic bounds
    this.cachedSize = this.initialConfig.size;
    this.camera.left = (-this.initialConfig.size * this.aspect) / 2;
    this.camera.right = (this.initialConfig.size * this.aspect) / 2;
    this.camera.top = this.initialConfig.size / 2;
    this.camera.bottom = -this.initialConfig.size / 2;

    // Reset near/far planes
    this.camera.near = this.initialConfig.near;
    this.camera.far = this.initialConfig.far;

    // Reset rotation (look at origin)
    this.camera.lookAt(0, 0, 0);

    // Restore orthographic bounds after lookAt
    this.camera.left = (-this.initialConfig.size * this.aspect) / 2;
    this.camera.right = (this.initialConfig.size * this.aspect) / 2;
    this.camera.top = this.initialConfig.size / 2;
    this.camera.bottom = -this.initialConfig.size / 2;

    console.log('[CAMERA_RESET] Stage 2 complete: Full reset to initial state');
  }

  private finalizeReset(): void {
    // Update projection matrix
    this.camera.updateProjectionMatrix();

    // Update internal state
    this.updateScreenCenterWorld();
    this.initializeSphericalCoordinates();
    this.updateNearFarPlanes();

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

  private updateNearFarPlanes(): void {
    // For orthographic camera, use fixed near/far planes that work regardless of camera position
    // Since orthographic projection doesn't have perspective distortion, we can use wide range
    const newNear = 0.1; // Allow objects behind camera
    const newFar = 100; // Allow objects far in front

    this.camera.near = newNear;
    this.camera.far = newFar;

    this.camera.updateProjectionMatrix();
  }

  dispose(): void {
    this.eventHandler.dispose();
  }
}
