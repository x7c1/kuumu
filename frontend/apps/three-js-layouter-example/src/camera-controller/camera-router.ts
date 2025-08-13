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
      this.implementation = new OrthographicCameraController(cameraConfig, zoomConfig);
    } else if (isPerspectiveConfig(cameraConfig)) {
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

  private captureCurrentState(): {
    position: THREE.Vector3;
    direction: THREE.Vector3;
    target: THREE.Vector3;
    zoomLevel: number;
    cameraType: string;
  } {
    const currentCamera = this.camera;
    const direction = new THREE.Vector3();
    currentCamera.getWorldDirection(direction);

    // Calculate the target point (where the camera is looking)
    const target = new THREE.Vector3();
    target.copy(currentCamera.position).add(direction);

    // Get appropriate zoom level based on camera type
    let zoomLevel: number;
    if (currentCamera.type === 'OrthographicCamera') {
      zoomLevel = (this.implementation as OrthographicCameraController).getCurrentSize();
    } else {
      zoomLevel = (this.implementation as PerspectiveCameraController).getCurrentDistance();
    }

    return {
      position: currentCamera.position.clone(),
      direction,
      target,
      zoomLevel,
      cameraType: currentCamera.type,
    };
  }

  // Convert perspective distance to orthographic size for equivalent view
  private perspectiveToOrthographicSize(distance: number, fovDegrees: number): number {
    const fovRadians = (fovDegrees * Math.PI) / 180;
    return 2 * distance * Math.tan(fovRadians / 2);
  }

  switchProjection(
    projection: ProjectionType,
    config: { camera: CameraControllerConfig; zoom: ZoomConfig }
  ): void {
    // Capture current state before switching
    const currentState = this.captureCurrentState();

    // Dispose current implementation
    this.implementation.dispose();

    // Calculate appropriate initial parameters to maintain similar view
    const standardFOV = 50;
    let appropriateSize: number = 50; // Default fallback

    if (projection === 'orthographic') {
      // Converting from perspective to orthographic
      if (currentState.cameraType === 'PerspectiveCamera') {
        const calculatedSize = this.perspectiveToOrthographicSize(
          currentState.zoomLevel,
          standardFOV
        );
        // Use calculated size to maintain equivalent zoom level
        appropriateSize = calculatedSize;
      } else {
        // Already orthographic, keep the same size
        appropriateSize = currentState.zoomLevel;
      }
    }

    // Create base config preserving the original initial position for reset functionality
    const baseConfigForCreation = {
      aspect: config.camera.aspect,
      near: config.camera.near,
      far: config.camera.far,
      position: {
        x: currentState.position.x,
        y: currentState.position.y,
        z: currentState.position.z,
      },
    };

    let newConfig: CameraControllerConfig;
    if (projection === 'orthographic') {
      newConfig = {
        ...baseConfigForCreation,
        size: appropriateSize,
      } as OrthographicCameraConfig;
    } else {
      // For perspective, maintain current position to avoid unwanted camera movement
      newConfig = {
        ...baseConfigForCreation,
        fov: standardFOV,
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

    // Maintain the same look direction
    this.camera.lookAt(currentState.target);

    // Restore the original initial config to preserve reset functionality
    this.restoreOriginalInitialConfig(projection);
  }

  private restoreOriginalInitialConfig(targetProjection: ProjectionType): void {
    // Create the appropriate config type based on target projection
    if (targetProjection === 'orthographic') {
      if (isPerspectiveConfig(this.originalInitialConfig)) {
        // Converting from perspective original to orthographic
        const orthographicConfig: OrthographicCameraConfig = {
          aspect: this.originalInitialConfig.aspect,
          near: this.originalInitialConfig.near,
          far: this.originalInitialConfig.far,
          position: this.originalInitialConfig.position,
          size: 50, // Use standard size
        };
        (this.implementation as OrthographicCameraController).updateInitialConfig(
          orthographicConfig
        );
      } else {
        // Already orthographic
        (this.implementation as OrthographicCameraController).updateInitialConfig(
          this.originalInitialConfig as OrthographicCameraConfig
        );
      }
    } else {
      if (isOrthographicConfig(this.originalInitialConfig)) {
        // Converting from orthographic original to perspective
        const perspectiveConfig: PerspectiveCameraConfig = {
          aspect: this.originalInitialConfig.aspect,
          near: this.originalInitialConfig.near,
          far: this.originalInitialConfig.far,
          position: this.originalInitialConfig.position,
          fov: 50, // Use standard FOV
        };
        (this.implementation as PerspectiveCameraController).updateInitialConfig(perspectiveConfig);
      } else {
        // Already perspective
        (this.implementation as PerspectiveCameraController).updateInitialConfig(
          this.originalInitialConfig as PerspectiveCameraConfig
        );
      }
    }
  }
}
