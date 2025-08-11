import * as THREE from 'three';
import type { ApplicationConfig } from './application';
import type {
  CameraControllerConfig,
  CameraRouter,
  OrthographicCameraConfig,
  PerspectiveCameraConfig,
} from './camera-controller';

export class CameraProjectionSwitcher {
  switchProjection(
    currentCameraRouter: CameraRouter,
    projection: string,
    config: ApplicationConfig
  ): CameraRouter {
    console.log('[PROJECTION_SWITCH] Called with projection:', projection);
    console.log(
      '[PROJECTION_SWITCH] Current camera type before switch:',
      currentCameraRouter.camera.type
    );

    const currentCamera = currentCameraRouter.camera;
    const currentPosition = currentCamera.position.clone();

    // Use fixed, stable values to prevent accumulation of rounding errors
    const STANDARD_ORTHOGRAPHIC_SIZE = 50;
    const STANDARD_PERSPECTIVE_DISTANCE = 50;
    const STANDARD_FOV = 50;

    // Preserve X,Y position (pan state) while adjusting Z for projection type
    const finalPosition = currentPosition.clone();
    let cameraSpecificConfig: { fov?: number; size?: number };

    if (projection === 'orthographic') {
      // For perspective → orthographic: preserve X,Y, set optimal Z
      finalPosition.z = STANDARD_PERSPECTIVE_DISTANCE;

      cameraSpecificConfig = { size: STANDARD_ORTHOGRAPHIC_SIZE, fov: undefined };

      console.log(
        '[PROJECTION_SWITCH] → Orthographic: preserving X,Y =',
        finalPosition.x,
        finalPosition.y,
        'setting Z =',
        finalPosition.z
      );
    } else {
      // For orthographic → perspective: preserve X,Y, set optimal Z
      finalPosition.z = STANDARD_PERSPECTIVE_DISTANCE;

      cameraSpecificConfig = { fov: STANDARD_FOV, size: undefined };

      console.log(
        '[PROJECTION_SWITCH] → Perspective: preserving X,Y =',
        finalPosition.x,
        finalPosition.y,
        'setting Z =',
        finalPosition.z
      );
    }

    console.log('[PROJECTION_SWITCH] Camera specific config:', cameraSpecificConfig);

    // Create base config with current position for camera placement (exclude size/fov)
    const baseConfigWithCurrentPosition = {
      aspect: config.camera.aspect,
      near: config.camera.near,
      far: config.camera.far,
      position: {
        x: finalPosition.x,
        y: finalPosition.y,
        z: finalPosition.z,
      },
    };

    console.log(
      '[PROJECTION_SWITCH] Base config with current position:',
      baseConfigWithCurrentPosition
    );

    // Create standard initial config for reset functionality
    const baseResetConfig = {
      aspect: config.camera.aspect,
      near: config.camera.near,
      far: config.camera.far,
      position: { x: 0, y: 0, z: STANDARD_PERSPECTIVE_DISTANCE },
    };

    let standardInitialConfig: CameraControllerConfig;
    if (projection === 'orthographic') {
      standardInitialConfig = {
        ...baseResetConfig,
        size: STANDARD_ORTHOGRAPHIC_SIZE,
      } as OrthographicCameraConfig;
    } else {
      standardInitialConfig = {
        ...baseResetConfig,
        fov: STANDARD_FOV,
      } as PerspectiveCameraConfig;
    }

    console.log('[PROJECTION_SWITCH] Standard initial config:', standardInitialConfig);

    const newCameraRouter = currentCameraRouter.preservePositionAndRecreate(
      baseConfigWithCurrentPosition,
      config.zoom,
      cameraSpecificConfig
    );

    console.log(
      '[PROJECTION_SWITCH] After recreate - New camera type:',
      newCameraRouter.camera.type
    );
    console.log('[PROJECTION_SWITCH] After recreate - New camera:', newCameraRouter.camera);

    // Update the camera controller's initial config to standard values
    newCameraRouter.updateInitialConfig(standardInitialConfig);

    // Preserve camera orientation - look at the same relative target
    // Calculate where the camera was looking based on current position
    const currentDirection = new THREE.Vector3();
    currentCamera.getWorldDirection(currentDirection);
    const lookTarget = currentPosition.clone().add(currentDirection.multiplyScalar(50));

    newCameraRouter.camera.lookAt(lookTarget);

    console.log('[PROJECTION_SWITCH] Final camera type:', newCameraRouter.camera.type);
    console.log('[PROJECTION_SWITCH] Final camera position:', newCameraRouter.camera.position);

    return newCameraRouter;
  }
}
