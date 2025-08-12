import { getScalingSystem } from '@kuumu/layouter/scaling';
import * as THREE from 'three';
import type { ProjectionType } from '../models';
import {
  type OrthographicCameraConfig,
  OrthographicCameraController,
} from './orthographic-camera-controller';
import {
  type PerspectiveCameraConfig,
  PerspectiveCameraController,
} from './perspective-camera-controller';
import type { ZoomConfig } from './zoom-strategy';

// New Union type for safer camera configuration
export type CameraControllerConfig = OrthographicCameraConfig | PerspectiveCameraConfig;

// Type guard functions for discriminated union
export function isOrthographicConfig(
  config: CameraControllerConfig
): config is OrthographicCameraConfig {
  return 'size' in config;
}

export function isPerspectiveConfig(
  config: CameraControllerConfig
): config is PerspectiveCameraConfig {
  return 'fov' in config;
}

type CameraControllerImplementation = OrthographicCameraController | PerspectiveCameraController;

export class CameraRouter {
  private implementation: CameraControllerImplementation;

  // Base orthographic camera size constant
  private static readonly BASE_ORTHOGRAPHIC_SIZE = 50;

  static createWithProjectionPreference(
    baseCameraConfig: Omit<CameraControllerConfig, 'fov' | 'size'>,
    zoomConfig: ZoomConfig,
    projection?: string
  ): CameraRouter {
    const scalingSystem = getScalingSystem();

    // Use fixed, stable values to prevent accumulation of rounding errors
    const STANDARD_ORTHOGRAPHIC_SIZE =
      CameraRouter.BASE_ORTHOGRAPHIC_SIZE / scalingSystem.getScaleFactor();
    const STANDARD_PERSPECTIVE_DISTANCE = 50;
    const STANDARD_FOV = 50;

    // Create base config without size or fov to avoid conflicts
    const baseConfig = {
      aspect: baseCameraConfig.aspect,
      near: baseCameraConfig.near,
      far: baseCameraConfig.far,
      position: { x: 0, y: 0, z: STANDARD_PERSPECTIVE_DISTANCE },
    };

    let cameraConfig: CameraControllerConfig;

    if (projection === 'perspective') {
      cameraConfig = {
        ...baseConfig,
        fov: STANDARD_FOV,
      } as PerspectiveCameraConfig;
      console.log('[CAMERA_INIT] Initializing with perspective camera');
    } else {
      // Default to orthographic
      cameraConfig = {
        ...baseConfig,
        size: STANDARD_ORTHOGRAPHIC_SIZE,
      } as OrthographicCameraConfig;
      console.log('[CAMERA_INIT] Initializing with orthographic camera');
    }

    console.log('[CAMERA_INIT] Final config:', cameraConfig);
    const router = new CameraRouter(cameraConfig, zoomConfig);
    router.setupEventListeners();
    return router;
  }

  constructor(cameraConfig: CameraControllerConfig, zoomConfig: ZoomConfig) {
    console.log('[CAMERA_ROUTER] Constructor called with config:', cameraConfig);
    console.log('[CAMERA_ROUTER] isOrthographicConfig:', isOrthographicConfig(cameraConfig));
    console.log('[CAMERA_ROUTER] isPerspectiveConfig:', isPerspectiveConfig(cameraConfig));

    // Handle Union type with type guards
    if (isOrthographicConfig(cameraConfig)) {
      console.log('[CAMERA_ROUTER] Creating OrthographicCameraController');
      this.implementation = new OrthographicCameraController(cameraConfig, zoomConfig);
    } else if (isPerspectiveConfig(cameraConfig)) {
      console.log('[CAMERA_ROUTER] Creating PerspectiveCameraController');
      this.implementation = new PerspectiveCameraController(cameraConfig, zoomConfig);
    } else {
      console.error(
        '[CAMERA_ROUTER] Invalid config - neither orthographic nor perspective:',
        cameraConfig
      );
      throw new Error(
        'Invalid camera configuration: must be either OrthographicCameraConfig or PerspectiveCameraConfig'
      );
    }

    console.log('[CAMERA_ROUTER] Final camera type:', this.implementation.camera.type);
  }

  get camera(): THREE.Camera {
    return this.implementation.camera;
  }

  setRenderCallback(callback: () => void): void {
    this.implementation.setRenderCallback(callback);
  }

  setContinuousRenderCallback(callback: (enabled: boolean) => void): void {
    this.implementation.setContinuousRenderCallback(callback);
  }

  setRotationCenterCallback(
    showCallback: (position: THREE.Vector3) => void,
    hideCallback: () => void,
    updateScaleCallback?: () => void
  ): void {
    this.implementation.setRotationCenterCallback(showCallback, hideCallback, updateScaleCallback);
  }

  setupEventListeners(): void {
    this.implementation.setupEventListeners();
  }

  getCurrentZoomState(): { type: string; value: number } {
    if (this.camera.type === 'OrthographicCamera') {
      return {
        type: 'orthographic',
        value: (this.implementation as OrthographicCameraController).getCurrentSize(),
      };
    } else {
      return {
        type: 'perspective',
        value: (this.implementation as PerspectiveCameraController).getCurrentDistance(),
      };
    }
  }

  dispose(): void {
    this.implementation.dispose();
  }

  recreateWithConfig(newConfig: CameraControllerConfig, zoomConfig: ZoomConfig): CameraRouter {
    console.log('[CAMERA_ROUTER] recreateWithConfig called with config:', newConfig);

    // Dispose this controller
    this.dispose();

    // Create new controller with new config
    const newController = new CameraRouter(newConfig, zoomConfig);
    newController.setupEventListeners();

    console.log(
      '[CAMERA_ROUTER] Created new controller with camera type:',
      newController.camera.type
    );
    return newController;
  }

  preservePositionAndRecreate(
    baseConfig: Partial<CameraControllerConfig>,
    zoomConfig: ZoomConfig,
    cameraSpecificConfig: { fov?: number; size?: number }
  ): CameraRouter {
    console.log('[CAMERA_ROUTER] preservePositionAndRecreate called with:', {
      baseConfig,
      cameraSpecificConfig,
    });

    // Create proper Union type config based on camera type
    let newConfig: CameraControllerConfig;
    if (cameraSpecificConfig.size !== undefined) {
      newConfig = {
        ...baseConfig,
        size: cameraSpecificConfig.size,
      } as OrthographicCameraConfig;
      console.log('[CAMERA_ROUTER] Creating orthographic config:', newConfig);
    } else if (cameraSpecificConfig.fov !== undefined) {
      newConfig = {
        ...baseConfig,
        fov: cameraSpecificConfig.fov,
      } as PerspectiveCameraConfig;
      console.log('[CAMERA_ROUTER] Creating perspective config:', newConfig);
    } else {
      throw new Error('Either size or fov must be provided in cameraSpecificConfig');
    }

    const result = this.recreateWithConfig(newConfig, zoomConfig);
    console.log('[CAMERA_ROUTER] Recreated camera type:', result.camera.type);
    return result;
  }

  updateInitialConfig(standardConfig: CameraControllerConfig): void {
    // Delegate to the implementation with proper type checking
    if (
      isOrthographicConfig(standardConfig) &&
      this.implementation instanceof OrthographicCameraController
    ) {
      this.implementation.updateInitialConfig(standardConfig);
    } else if (
      isPerspectiveConfig(standardConfig) &&
      this.implementation instanceof PerspectiveCameraController
    ) {
      this.implementation.updateInitialConfig(standardConfig);
    }
  }

  private captureCurrentState(): {
    position: THREE.Vector3;
    direction: THREE.Vector3;
  } {
    const currentCamera = this.camera;
    const direction = new THREE.Vector3();
    currentCamera.getWorldDirection(direction);

    return {
      position: currentCamera.position.clone(),
      direction,
    };
  }

  private restoreState(state: ReturnType<typeof CameraRouter.prototype.captureCurrentState>): void {
    // Restore position
    this.camera.position.copy(state.position);

    // Restore camera direction by calculating look target
    const lookTarget = state.position.clone().add(state.direction.multiplyScalar(50));
    this.camera.lookAt(lookTarget);

    console.log('[CAMERA_ROUTER] Camera position and direction restored');
  }

  updateCameraSize(): void {
    const scalingSystem = getScalingSystem();
    const newOrthographicSize =
      CameraRouter.BASE_ORTHOGRAPHIC_SIZE / scalingSystem.getScaleFactor();

    // Update camera size if using orthographic projection
    if (this.camera.type === 'OrthographicCamera') {
      const orthoCamera = this.camera as THREE.OrthographicCamera;
      const aspect = orthoCamera.right / orthoCamera.top;

      orthoCamera.left = (-newOrthographicSize * aspect) / 2;
      orthoCamera.right = (newOrthographicSize * aspect) / 2;
      orthoCamera.top = newOrthographicSize / 2;
      orthoCamera.bottom = -newOrthographicSize / 2;
      orthoCamera.updateProjectionMatrix();
    }
  }

  switchProjection(
    projection: ProjectionType,
    config: { camera: CameraControllerConfig; zoom: ZoomConfig }
  ): void {
    console.log(`[CAMERA_ROUTER] Switching to ${projection} projection`);

    // Capture current state before switching
    const currentState = this.captureCurrentState();

    // Dispose current implementation
    this.implementation.dispose();

    // Create base config for initial camera creation (using standard initial position)
    const standardInitialPosition = { x: 0, y: 0, z: 50 };
    const baseConfigForCreation = {
      aspect: config.camera.aspect,
      near: config.camera.near,
      far: config.camera.far,
      position: standardInitialPosition,
    };

    let newConfig: CameraControllerConfig;
    if (projection === 'orthographic') {
      newConfig = {
        ...baseConfigForCreation,
        size: 50, // Standard orthographic size
      } as OrthographicCameraConfig;
    } else {
      newConfig = {
        ...baseConfigForCreation,
        fov: 50, // Standard FOV
      } as PerspectiveCameraConfig;
    }

    // Create new implementation
    if (isOrthographicConfig(newConfig)) {
      this.implementation = new OrthographicCameraController(newConfig, config.zoom);
    } else if (isPerspectiveConfig(newConfig)) {
      this.implementation = new PerspectiveCameraController(newConfig, config.zoom);
    } else {
      throw new Error('Invalid camera configuration during projection switch');
    }

    // Setup event listeners for new implementation
    this.implementation.setupEventListeners();

    // Restore state to new implementation
    this.restoreState(currentState);

    // Update initial config for reset functionality
    if (
      isOrthographicConfig(newConfig) &&
      this.implementation instanceof OrthographicCameraController
    ) {
      this.implementation.updateInitialConfig(newConfig);
    } else if (
      isPerspectiveConfig(newConfig) &&
      this.implementation instanceof PerspectiveCameraController
    ) {
      this.implementation.updateInitialConfig(newConfig);
    }

    console.log(
      `[CAMERA_ROUTER] Successfully switched to ${projection}, camera type: ${this.camera.type}`
    );
  }
}
