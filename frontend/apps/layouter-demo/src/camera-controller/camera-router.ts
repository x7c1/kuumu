import { getScalingSystem } from '@kuumu/layouter/scaling';
import type * as THREE from 'three';
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
  private originalInitialConfig: CameraControllerConfig;

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
    } else {
      // Default to orthographic
      cameraConfig = {
        ...baseConfig,
        size: STANDARD_ORTHOGRAPHIC_SIZE,
      } as OrthographicCameraConfig;
    }

    const router = new CameraRouter(cameraConfig, zoomConfig);
    router.setupEventListeners();
    return router;
  }

  constructor(cameraConfig: CameraControllerConfig, zoomConfig: ZoomConfig) {
    // Store the original initial config for reset functionality
    this.originalInitialConfig = JSON.parse(JSON.stringify(cameraConfig));

    // Handle Union type with type guards
    if (isOrthographicConfig(cameraConfig)) {
      this.implementation = new OrthographicCameraController(
        cameraConfig,
        zoomConfig,
        cameraConfig
      );
    } else if (isPerspectiveConfig(cameraConfig)) {
      this.implementation = new PerspectiveCameraController(cameraConfig, zoomConfig, cameraConfig);
    } else {
      console.error(
        '[CAMERA_ROUTER] Invalid config - neither orthographic nor perspective:',
        cameraConfig
      );
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

  dispose(): void {
    this.implementation.dispose();
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

  switchProjection(
    projection: ProjectionType,
    config: { camera: CameraControllerConfig; zoom: ZoomConfig }
  ): void {
    // Dispose current implementation
    this.implementation.dispose();

    // Always reset to initial state - simple and predictable
    const standardFOV = 50;
    const standardSize = 50;
    const initialPosition = { x: 0, y: 0, z: 50 };

    // Create config with initial state
    const baseConfigForCreation = {
      aspect: config.camera.aspect,
      near: config.camera.near,
      far: config.camera.far,
      position: initialPosition,
    };

    let newConfig: CameraControllerConfig;
    if (projection === 'orthographic') {
      newConfig = {
        ...baseConfigForCreation,
        size: standardSize,
      } as OrthographicCameraConfig;
    } else {
      newConfig = {
        ...baseConfigForCreation,
        fov: standardFOV,
      } as PerspectiveCameraConfig;
    }

    // Create new implementation with proper initial config
    if (isOrthographicConfig(newConfig)) {
      const initialConfig = this.createOrthographicInitialConfig();
      this.implementation = new OrthographicCameraController(newConfig, config.zoom, initialConfig);
    } else if (isPerspectiveConfig(newConfig)) {
      const initialConfig = this.createPerspectiveInitialConfig();
      this.implementation = new PerspectiveCameraController(newConfig, config.zoom, initialConfig);
    } else {
      throw new Error('Invalid camera configuration during projection switch');
    }

    // Setup event listeners for new implementation
    this.implementation.setupEventListeners();

    // Look at origin
    this.camera.lookAt(0, 0, 0);
  }

  private createOrthographicInitialConfig(): OrthographicCameraConfig {
    if (isPerspectiveConfig(this.originalInitialConfig)) {
      // Converting from perspective original to orthographic
      return {
        aspect: this.originalInitialConfig.aspect,
        near: this.originalInitialConfig.near,
        far: this.originalInitialConfig.far,
        position: this.originalInitialConfig.position,
        size: 50, // Use standard size
      };
    } else {
      // Already orthographic
      return this.originalInitialConfig as OrthographicCameraConfig;
    }
  }

  private createPerspectiveInitialConfig(): PerspectiveCameraConfig {
    if (isOrthographicConfig(this.originalInitialConfig)) {
      // Converting from orthographic original to perspective
      return {
        aspect: this.originalInitialConfig.aspect,
        near: this.originalInitialConfig.near,
        far: this.originalInitialConfig.far,
        position: this.originalInitialConfig.position,
        fov: 50, // Use standard FOV
      };
    } else {
      // Already perspective
      return this.originalInitialConfig as PerspectiveCameraConfig;
    }
  }

  updateAspectRatio(aspectRatio: number): void {
    this.implementation.updateAspectRatio(aspectRatio);
  }
}
