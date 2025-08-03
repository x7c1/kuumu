export interface ZoomConfig {
  min: number;
  max: number;
  sensitivity: number;
}

export interface ZoomCalculation {
  newValue: number;
  zoomRatio: number;
  worldPosition: { x: number; y: number };
}

export abstract class ZoomStrategy {
  constructor(protected zoomConfig: ZoomConfig) {}

  protected abstract calculateViewDimensions(
    currentValue: number,
    aspect: number
  ): { width: number; height: number };

  protected calculateMousePosition(event: WheelEvent): { mouseX: number; mouseY: number } {
    const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    const mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    return { mouseX, mouseY };
  }

  protected calculateZoomFactor(event: WheelEvent): number {
    return 1 + (event.deltaY > 0 ? 1 : -1) * this.zoomConfig.sensitivity;
  }

  protected clampValue(value: number): number {
    return Math.max(this.zoomConfig.min, Math.min(this.zoomConfig.max, value));
  }
}

export class OrthographicZoomStrategy extends ZoomStrategy {
  calculateZoom(event: WheelEvent, currentValue: number, aspect: number): ZoomCalculation {
    const zoomFactor = this.calculateZoomFactor(event);
    const { mouseX, mouseY } = this.calculateMousePosition(event);

    // Calculate camera-specific dimensions
    const { width, height } = this.calculateViewDimensions(currentValue, aspect);

    // Convert mouse position to world coordinates
    const worldX = (mouseX * width) / 2;
    const worldY = (mouseY * height) / 2;

    const newValue = this.clampValue(currentValue * zoomFactor);
    const zoomRatio = newValue / currentValue;

    return {
      newValue,
      zoomRatio,
      worldPosition: { x: worldX, y: worldY },
    };
  }

  protected calculateViewDimensions(
    currentSize: number,
    aspect: number
  ): { width: number; height: number } {
    return {
      width: currentSize * aspect,
      height: currentSize,
    };
  }
}

export class PerspectiveZoomStrategy extends ZoomStrategy {
  constructor(
    zoomConfig: ZoomConfig,
    private cachedFovTan: number
  ) {
    super(zoomConfig);
  }

  calculateZoom(event: WheelEvent, currentDistance: number, aspect: number): ZoomCalculation {
    const zoomFactor = this.calculateZoomFactor(event);
    const { mouseX, mouseY } = this.calculateMousePosition(event);

    // Calculate perspective view dimensions at current distance
    const { width, height } = this.calculateViewDimensions(currentDistance, aspect);

    // Convert mouse position to world coordinates at current distance
    const worldX = (mouseX * width) / 2;
    const worldY = (mouseY * height) / 2;

    // Convert current distance to equivalent orthographic size for zoom calculation
    const currentOrthographicSize = 2 * this.cachedFovTan * currentDistance;
    const newOrthographicSize = this.clampValue(currentOrthographicSize * zoomFactor);

    // Convert back to perspective distance
    const newDistance = newOrthographicSize / (2 * this.cachedFovTan);

    // Clamp the distance to valid range
    const clampedDistance = Math.max(
      this.zoomConfig.min / (2 * this.cachedFovTan),
      Math.min(this.zoomConfig.max / (2 * this.cachedFovTan), newDistance)
    );

    // Calculate the correct zoom ratio based on actual distance change
    const actualZoomRatio = clampedDistance / currentDistance;

    return {
      newValue: clampedDistance,
      zoomRatio: actualZoomRatio,
      worldPosition: { x: worldX, y: worldY },
    };
  }

  protected calculateViewDimensions(
    currentDistance: number,
    aspect: number
  ): { width: number; height: number } {
    const height = 2 * this.cachedFovTan * currentDistance;
    return {
      width: height * aspect,
      height,
    };
  }
}
