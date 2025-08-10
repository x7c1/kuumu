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
export function isOrthographicConfig(config: CameraControllerConfig | CameraRouterConfig): config is OrthographicCameraConfig {
  return 'size' in config && config.size !== undefined;
}

export function isPerspectiveConfig(config: CameraControllerConfig | CameraRouterConfig): config is PerspectiveCameraConfig {
  return 'fov' in config && config.fov !== undefined;
}

export interface CameraRouterConfig {
  size?: number;
  fov?: number;
  aspect: number;
  near: number;
  far: number;
  position: { x: number; y: number; z: number };
}

type CameraControllerImplementation = OrthographicCameraController | PerspectiveCameraController;

export class CameraRouter {
  private implementation: CameraControllerImplementation;

  constructor(cameraConfig: CameraRouterConfig, zoomConfig: ZoomConfig);
  constructor(cameraConfig: CameraControllerConfig, zoomConfig: ZoomConfig);
  constructor(cameraConfig: CameraRouterConfig | CameraControllerConfig, zoomConfig: ZoomConfig) {
    // Handle new Union type with type guards
    if (isOrthographicConfig(cameraConfig)) {
      this.implementation = new OrthographicCameraController(cameraConfig, zoomConfig);
    } else if (isPerspectiveConfig(cameraConfig)) {
      this.implementation = new PerspectiveCameraController(cameraConfig, zoomConfig);
    }
    // Handle legacy CameraRouterConfig
    else if (cameraConfig.size !== undefined) {
      // Create orthographic camera controller
      const orthoConfig: OrthographicCameraConfig = {
        size: cameraConfig.size,
        aspect: cameraConfig.aspect,
        near: cameraConfig.near,
        far: cameraConfig.far,
        position: cameraConfig.position,
      };
      this.implementation = new OrthographicCameraController(orthoConfig, zoomConfig);
    } else if (cameraConfig.fov !== undefined) {
      // Create perspective camera controller
      const perspConfig: PerspectiveCameraConfig = {
        fov: cameraConfig.fov,
        aspect: cameraConfig.aspect,
        near: cameraConfig.near,
        far: cameraConfig.far,
        position: cameraConfig.position,
      };
      this.implementation = new PerspectiveCameraController(perspConfig, zoomConfig);
    } else {
      throw new Error('Either size or fov must be provided in camera config');
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

  recreateWithConfig(newConfig: CameraRouterConfig, zoomConfig: ZoomConfig): CameraRouter {
    // Dispose this controller
    this.dispose();

    // Create new controller with new config
    const newController = new CameraRouter(newConfig, zoomConfig);
    newController.setupEventListeners();

    return newController;
  }

  preservePositionAndRecreate(
    baseConfig: CameraRouterConfig,
    zoomConfig: ZoomConfig,
    cameraSpecificConfig: { fov?: number; size?: number }
  ): CameraRouter {
    // Use the position from baseConfig (which already contains the desired position)
    const newConfig = {
      ...baseConfig,
      ...cameraSpecificConfig,
      // Don't override position - use the one from baseConfig
    };

    return this.recreateWithConfig(newConfig, zoomConfig);
  }

  updateInitialConfig(standardConfig: CameraRouterConfig & { fov?: number; size?: number }): void {
    // Delegate to the implementation
    if ('updateInitialConfig' in this.implementation) {
      (this.implementation as any).updateInitialConfig(standardConfig);
    }
  }
}
