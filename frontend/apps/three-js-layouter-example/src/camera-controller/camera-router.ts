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
    // Handle Union type with type guards
    if (isOrthographicConfig(cameraConfig)) {
      this.implementation = new OrthographicCameraController(cameraConfig, zoomConfig);
    } else if (isPerspectiveConfig(cameraConfig)) {
      this.implementation = new PerspectiveCameraController(cameraConfig, zoomConfig);
    } else {
      throw new Error(
        'Invalid camera configuration: must be either OrthographicCameraConfig or PerspectiveCameraConfig'
      );
    }
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
    // Dispose this controller
    this.dispose();

    // Create new controller with new config
    const newController = new CameraRouter(newConfig, zoomConfig);
    newController.setupEventListeners();

    return newController;
  }

  preservePositionAndRecreate(
    baseConfig: CameraControllerConfig,
    zoomConfig: ZoomConfig,
    cameraSpecificConfig: { fov?: number; size?: number }
  ): CameraRouter {
    // Create proper Union type config based on camera type
    let newConfig: CameraControllerConfig;
    if (cameraSpecificConfig.size !== undefined) {
      newConfig = {
        ...baseConfig,
        size: cameraSpecificConfig.size,
      } as OrthographicCameraConfig;
    } else if (cameraSpecificConfig.fov !== undefined) {
      newConfig = {
        ...baseConfig,
        fov: cameraSpecificConfig.fov,
      } as PerspectiveCameraConfig;
    } else {
      throw new Error('Either size or fov must be provided in cameraSpecificConfig');
    }

    return this.recreateWithConfig(newConfig, zoomConfig);
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
