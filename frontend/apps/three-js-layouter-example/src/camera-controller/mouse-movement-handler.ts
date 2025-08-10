import { CameraConstants } from './camera-constants';

export interface MovementHandlers {
  handlePlanar: (deltaX: number, deltaY: number, startPos: { x: number; y: number; z: number }) => void;
  handleDepth: (deltaY: number, startPos: { x: number; y: number; z: number }) => void;
  handleRotation: (deltaX: number, deltaY: number, startRotation: { x: number; y: number }) => void;
}

export class MouseMovementHandler {
  constructor(private handlers: MovementHandlers) {}

  handleMouseMove(
    deltaX: number,
    deltaY: number,
    startPos: { x: number; y: number; z: number },
    startRotation: { x: number; y: number },
    isShiftPressed: boolean,
    isCtrlPressed: boolean
  ): void {
    if (isShiftPressed) {
      // Shift + mouse: depth movement
      this.handlers.handleDepth(deltaY, startPos);
    } else if (isCtrlPressed) {
      // Ctrl + mouse: rotation around screen center
      this.handlers.handleRotation(deltaX, deltaY, startRotation);
    } else {
      // Normal mouse: planar movement
      this.handlers.handlePlanar(deltaX, deltaY, startPos);
    }
  }

  static calculatePlanarSensitivity(
    width: number,
    height: number,
    windowWidth: number,
    windowHeight: number
  ): { x: number; y: number } {
    const sensitivityX = width / windowWidth;
    const sensitivityY = height / windowHeight;

    // Check for extreme sensitivity values and use fallback
    const finalSensitivityX =
      sensitivityX > CameraConstants.SENSITIVITY_MIN &&
      sensitivityX < CameraConstants.SENSITIVITY_MAX
        ? sensitivityX
        : CameraConstants.FALLBACK_SENSITIVITY_X;

    const finalSensitivityY =
      sensitivityY > CameraConstants.SENSITIVITY_MIN &&
      sensitivityY < CameraConstants.SENSITIVITY_MAX
        ? sensitivityY
        : CameraConstants.FALLBACK_SENSITIVITY_Y;

    return { x: finalSensitivityX, y: finalSensitivityY };
  }
}
