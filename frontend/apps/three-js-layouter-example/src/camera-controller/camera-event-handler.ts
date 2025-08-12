import type { Coordinate } from '../models';

export class CameraEventHandler {
  private isDragging = false;
  private dragStartMousePosition = { x: 0, y: 0 };
  private rotationStartMousePosition = { x: 0, y: 0 };
  private depthStartMousePosition = { x: 0, y: 0 };
  private dragStartCameraPosition: Coordinate = { x: 0, y: 0, z: 0 };
  private dragStartCameraRotation = { x: 0, y: 0 };
  private renderCallback?: () => void;
  private continuousRenderCallback?: (enabled: boolean) => void;
  private isAnimating = false;
  private isRotating = false;
  private isDepthMoving = false;

  // Mouse double-click detection for Ctrl+double-click camera reset
  private lastMouseClickTime = 0;
  private doubleClickThreshold = 400; // milliseconds

  // Store key states at drag start to maintain consistent behavior during drag
  private dragStartKeyStates = { ctrlKey: false, shiftKey: false };

  // Store bound event handlers for proper cleanup
  private boundHandleWheel: (event: WheelEvent) => void;
  private boundHandleResize: () => void;
  private boundHandleMouseDown: (event: MouseEvent) => void;
  private boundHandleMouseMove: (event: MouseEvent) => void;
  private boundHandleMouseUp: () => void;
  private boundHandleKeyUp: (event: KeyboardEvent) => void;

  constructor(
    private wheelHandler: (event: WheelEvent) => void,
    private resizeHandler: () => void,
    private mouseMoveHandler: (
      deltaX: number,
      deltaY: number,
      startPos: Coordinate,
      startRotation: { x: number; y: number },
      isShiftPressed: boolean,
      isCtrlPressed: boolean
    ) => void,
    private mouseDownHandler: (event: MouseEvent) => void,
    private hideRotationCenterCallback?: () => void,
    private resetCameraCallback?: () => void
  ) {
    // Bind event handlers once to avoid repeated function creation
    this.boundHandleWheel = this.handleWheel.bind(this);
    this.boundHandleResize = this.handleResize.bind(this);
    this.boundHandleMouseDown = this.handleMouseDown.bind(this);
    this.boundHandleMouseMove = this.handleMouseMove.bind(this);
    this.boundHandleMouseUp = this.handleMouseUp.bind(this);
    this.boundHandleKeyUp = this.handleKeyUp.bind(this);
  }

  setRenderCallback(callback: () => void): void {
    this.renderCallback = callback;
  }

  setContinuousRenderCallback(callback: (enabled: boolean) => void): void {
    this.continuousRenderCallback = callback;
  }

  setAnimating(isAnimating: boolean): void {
    this.isAnimating = isAnimating;
  }

  setupEventListeners(): void {
    document.addEventListener('wheel', this.boundHandleWheel, { passive: false });
    window.addEventListener('resize', this.boundHandleResize);
    document.addEventListener('mousedown', this.boundHandleMouseDown);
    document.addEventListener('mousemove', this.boundHandleMouseMove);
    document.addEventListener('mouseup', this.boundHandleMouseUp);
    document.addEventListener('keyup', this.boundHandleKeyUp);
  }

  private handleWheel(event: WheelEvent): void {
    this.wheelHandler(event);
  }

  private handleResize(): void {
    this.resizeHandler();
  }

  private handleMouseDown(event: MouseEvent): void {
    // Check for Ctrl+double-click camera reset
    if (event.ctrlKey) {
      const currentTime = Date.now();
      const timeDiff = currentTime - this.lastMouseClickTime;

      if (timeDiff < this.doubleClickThreshold && this.lastMouseClickTime > 0) {
        // Ctrl+double-click detected - reset camera
        console.log('🎯 CTRL+DOUBLE-CLICK DETECTED - RESETTING CAMERA 🎯');
        this.resetCameraCallback?.();
        this.lastMouseClickTime = 0; // Reset to prevent multiple triggers
        return; // Don't process as normal mouse down
      }

      this.lastMouseClickTime = currentTime;
    }

    this.isDragging = true;
    this.dragStartMousePosition = { x: event.clientX, y: event.clientY };

    // Store key states at drag start to maintain consistent behavior during drag
    this.dragStartKeyStates = {
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
    };

    this.continuousRenderCallback?.(true);
    this.mouseDownHandler(event);
  }

  private handleMouseMove(event: MouseEvent): void {
    if (this.isAnimating) return;

    // Check if we should handle rotation (Ctrl key currently pressed)
    if (event.ctrlKey) {
      // Start rotation if not already rotating
      if (!this.isRotating) {
        this.startRotation(event);
        return;
      }

      // Calculate delta from rotation start position
      const deltaX = event.clientX - this.rotationStartMousePosition.x;
      const deltaY = event.clientY - this.rotationStartMousePosition.y;

      // For rotation, we don't need dragging to be active
      this.mouseMoveHandler(
        deltaX,
        deltaY,
        this.dragStartCameraPosition,
        this.dragStartCameraRotation,
        event.shiftKey,
        event.ctrlKey
      );
      this.renderCallback?.();
      return;
    }

    // Stop rotation if Ctrl is released
    if (this.isRotating) {
      this.stopRotation();
    }

    // Check if we should handle depth movement (Shift key currently pressed)
    if (event.shiftKey) {
      // Start depth movement if not already moving
      if (!this.isDepthMoving) {
        this.startDepthMovement(event);
        return;
      }

      // Calculate delta from depth movement start position
      const deltaY = event.clientY - this.depthStartMousePosition.y;

      // For depth movement, we don't need dragging to be active
      this.mouseMoveHandler(
        0, // No X movement for depth
        deltaY,
        this.dragStartCameraPosition,
        this.dragStartCameraRotation,
        event.shiftKey,
        event.ctrlKey
      );
      this.renderCallback?.();
      return;
    }

    // Stop depth movement if Shift is released
    if (this.isDepthMoving) {
      this.stopDepthMovement();
    }

    // For non-rotation movement, require dragging to be active
    if (!this.isDragging) return;

    // Calculate absolute difference from drag start position
    const deltaX = event.clientX - this.dragStartMousePosition.x;
    const deltaY = event.clientY - this.dragStartMousePosition.y;

    // Use key states from drag start, not current key states
    this.mouseMoveHandler(
      deltaX,
      deltaY,
      this.dragStartCameraPosition,
      this.dragStartCameraRotation,
      this.dragStartKeyStates.shiftKey,
      this.dragStartKeyStates.ctrlKey
    );

    // Trigger render on mouse move for smooth dragging
    this.renderCallback?.();
  }

  private handleMouseUp(): void {
    this.isDragging = false;
    this.continuousRenderCallback?.(false);
  }

  private handleKeyUp(event: KeyboardEvent): void {
    // Stop rotation when Ctrl key is released
    if (event.key === 'Control' && this.isRotating) {
      this.stopRotation();
    }

    // Stop depth movement when Shift key is released
    if (event.key === 'Shift' && this.isDepthMoving) {
      this.stopDepthMovement();
    }
  }

  private startRotation(event: MouseEvent): void {
    this.isRotating = true;
    this.rotationStartMousePosition = { x: event.clientX, y: event.clientY };

    // Create a fake mouse event to trigger the mousedown handler
    const fakeEvent = {
      clientX: event.clientX,
      clientY: event.clientY,
      ctrlKey: true,
      shiftKey: event.shiftKey,
    } as MouseEvent;

    // Trigger mousedown to update camera reference points
    this.mouseDownHandler(fakeEvent);
  }

  stopRotation(): void {
    this.isRotating = false;
    // Hide rotation center indicator when rotation stops
    this.hideRotationCenterCallback?.();
  }

  private startDepthMovement(event: MouseEvent): void {
    this.isDepthMoving = true;
    this.depthStartMousePosition = { x: event.clientX, y: event.clientY };

    // Create a fake mouse event to trigger the mousedown handler
    const fakeEvent = {
      clientX: event.clientX,
      clientY: event.clientY,
      ctrlKey: event.ctrlKey,
      shiftKey: true,
    } as MouseEvent;

    // Trigger mousedown to update camera reference points
    this.mouseDownHandler(fakeEvent);
  }

  private stopDepthMovement(): void {
    this.isDepthMoving = false;
  }

  // Methods to be called by camera controllers
  setDragStartCameraPosition(x: number, y: number, z: number): void {
    this.dragStartCameraPosition = { x, y, z };
  }

  setDragStartCameraRotation(x: number, y: number): void {
    this.dragStartCameraRotation = { x, y };
  }

  getDragStartCameraPosition(): Coordinate {
    return this.dragStartCameraPosition;
  }

  triggerRender(): void {
    this.renderCallback?.();
  }

  dispose(): void {
    document.removeEventListener('wheel', this.boundHandleWheel);
    window.removeEventListener('resize', this.boundHandleResize);
    document.removeEventListener('mousedown', this.boundHandleMouseDown);
    document.removeEventListener('mousemove', this.boundHandleMouseMove);
    document.removeEventListener('mouseup', this.boundHandleMouseUp);
    document.removeEventListener('keyup', this.boundHandleKeyUp);
  }
}
