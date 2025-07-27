// Scaling system for Three.js units based on viewport and DPI
export interface ScalingConfig {
  // Base reference size in pixels (what 1 Three.js unit should represent)
  basePixelSize: number;
  // Reference viewport width for scaling calculations
  referenceViewportWidth: number;
  // Reference viewport height for scaling calculations
  referenceViewportHeight: number;
  // Minimum scale factor to prevent elements from becoming too small
  minScale: number;
  // Maximum scale factor to prevent elements from becoming too large
  maxScale: number;
}

export interface ViewportInfo {
  width: number;
  height: number;
  devicePixelRatio: number;
  aspectRatio: number;
}

export class ScalingSystem {
  private config: ScalingConfig;
  private currentViewport: ViewportInfo;
  private scaleFactor: number = 1;

  constructor(config: ScalingConfig) {
    this.config = config;
    this.currentViewport = this.getViewportInfo();
    this.updateScaleFactor();
  }

  // Get current viewport information
  getViewportInfo(): ViewportInfo {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio || 1,
      aspectRatio: window.innerWidth / window.innerHeight,
    };
  }

  // Calculate scale factor based on DPI only, not viewport size
  private updateScaleFactor(): void {
    const viewport = this.currentViewport;

    // Only use DPI scaling, not viewport size scaling
    // This ensures consistent physical size regardless of viewport size
    const dpiScale = Math.min(viewport.devicePixelRatio, 2); // Cap at 2x for very high DPI
    const baseScale = Math.sqrt(dpiScale); // Square root to reduce DPI impact

    // Clamp to min/max values
    this.scaleFactor = Math.max(this.config.minScale, Math.min(this.config.maxScale, baseScale));
  }

  // Update scaling when DPI changes (not viewport size)
  updateViewport(): void {
    const newViewport = this.getViewportInfo();
    const dpiChanged = newViewport.devicePixelRatio !== this.currentViewport.devicePixelRatio;

    // Always update viewport info, but only recalculate scale factor if DPI changed
    this.currentViewport = newViewport;

    if (dpiChanged) {
      this.updateScaleFactor();
    }
  }

  // Convert physical pixels to Three.js units
  pixelsToThreeUnits(pixels: number): number {
    return (pixels / this.config.basePixelSize) * this.scaleFactor;
  }

  // Convert Three.js units to physical pixels
  threeUnitsToPixels(units: number): number {
    return (units * this.config.basePixelSize) / this.scaleFactor;
  }

  // Get current scale factor
  getScaleFactor(): number {
    return this.scaleFactor;
  }

  // Calculate appropriate font size for given pixel target
  getFontSizeForPixels(targetPixels: number): number {
    return this.pixelsToThreeUnits(targetPixels);
  }

  // Calculate appropriate spacing for given pixel target
  getSpacingForPixels(targetPixels: number): number {
    return this.pixelsToThreeUnits(targetPixels);
  }

  // Get debug information
  getDebugInfo(): {
    scaleFactor: number;
    viewport: ViewportInfo;
    config: ScalingConfig;
  } {
    return {
      scaleFactor: this.scaleFactor,
      viewport: this.currentViewport,
      config: this.config,
    };
  }
}

// Default scaling configuration
export const DEFAULT_SCALING_CONFIG: ScalingConfig = {
  // 1 Three.js unit = 20px at reference size
  basePixelSize: 20,

  // Reference: Full HD width
  referenceViewportWidth: 1920,

  // Reference: Full HD height
  referenceViewportHeight: 1080,

  // Minimum 50% scale
  minScale: 0.5,

  // Maximum 200% scale
  maxScale: 2.0,
};

// Singleton instance for easy access
let scalingSystemInstance: ScalingSystem | null = null;

export function getScalingSystem(): ScalingSystem {
  if (!scalingSystemInstance) {
    scalingSystemInstance = new ScalingSystem(DEFAULT_SCALING_CONFIG);
  }
  return scalingSystemInstance;
}

export function initializeScalingSystem(config?: Partial<ScalingConfig>): ScalingSystem {
  const finalConfig = { ...DEFAULT_SCALING_CONFIG, ...config };
  scalingSystemInstance = new ScalingSystem(finalConfig);
  return scalingSystemInstance;
}

// Utility functions for common scaling operations
export function scaleFont(targetPixels: number): number {
  return getScalingSystem().getFontSizeForPixels(targetPixels);
}

export function scaleSpacing(targetPixels: number): number {
  return getScalingSystem().getSpacingForPixels(targetPixels);
}

export function scalePadding(targetPixels: number): number {
  return getScalingSystem().getSpacingForPixels(targetPixels);
}
