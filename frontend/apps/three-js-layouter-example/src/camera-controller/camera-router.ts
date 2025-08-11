import type * as THREE from 'three';
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
}
