// Unit system for Three.js - similar to CSS rem/em
import { getScalingSystem } from './scaling-system';

export interface UnitConfig {
  // Base font size in pixels (like CSS html { font-size: 16px })
  baseFontSize: number;
  // Base spacing unit in pixels
  baseSpacing: number;
  // Base padding unit in pixels
  basePadding: number;
}

export class UnitSystem {
  private config: UnitConfig;
  private contextStack: UnitContext[] = [];

  constructor(config: UnitConfig) {
    this.config = config;
  }

  // === REM-like units (based on root/base values) ===

  // Font size in rem units (1rem = base font size)
  rem(value: number): number {
    const scalingSystem = getScalingSystem();
    const targetPixels = value * this.config.baseFontSize;
    return scalingSystem.getFontSizeForPixels(targetPixels);
  }

  // Spacing in rem units
  srem(value: number): number {
    const scalingSystem = getScalingSystem();
    const targetPixels = value * this.config.baseSpacing;
    return scalingSystem.getSpacingForPixels(targetPixels);
  }

  // Padding in rem units
  prem(value: number): number {
    const scalingSystem = getScalingSystem();
    const targetPixels = value * this.config.basePadding;
    return scalingSystem.getSpacingForPixels(targetPixels);
  }

  // === EM-like units (based on current context) ===

  // Font size in em units (1em = current font size)
  em(value: number): number {
    const currentContext = this.getCurrentContext();
    const scalingSystem = getScalingSystem();
    const targetPixels = value * currentContext.fontSize;
    return scalingSystem.getFontSizeForPixels(targetPixels);
  }

  // Spacing in em units
  sem(value: number): number {
    const currentContext = this.getCurrentContext();
    const scalingSystem = getScalingSystem();
    const targetPixels = value * currentContext.fontSize;
    return scalingSystem.getSpacingForPixels(targetPixels);
  }

  // Padding in em units
  pem(value: number): number {
    const currentContext = this.getCurrentContext();
    const scalingSystem = getScalingSystem();
    const targetPixels = value * currentContext.fontSize;
    return scalingSystem.getSpacingForPixels(targetPixels);
  }

  // === Pixel units (absolute) ===

  // Direct pixel conversion
  px(value: number): number {
    const scalingSystem = getScalingSystem();
    return scalingSystem.getFontSizeForPixels(value);
  }

  // === Viewport units ===

  // Viewport width units (1vw = 1% of viewport width)
  vw(value: number): number {
    const scalingSystem = getScalingSystem();
    const viewport = scalingSystem.getViewportInfo();
    const targetPixels = (value / 100) * viewport.width;
    return scalingSystem.getFontSizeForPixels(targetPixels);
  }

  // Viewport height units (1vh = 1% of viewport height)
  vh(value: number): number {
    const scalingSystem = getScalingSystem();
    const viewport = scalingSystem.getViewportInfo();
    const targetPixels = (value / 100) * viewport.height;
    return scalingSystem.getFontSizeForPixels(targetPixels);
  }

  // === Context management ===

  // Push new context (like entering a new element)
  pushContext(context: Partial<UnitContext>): void {
    const currentContext = this.getCurrentContext();
    const newContext: UnitContext = {
      fontSize: context.fontSize ?? currentContext.fontSize,
      spacing: context.spacing ?? currentContext.spacing,
      padding: context.padding ?? currentContext.padding,
    };
    this.contextStack.push(newContext);
  }

  // Pop context (like exiting an element)
  popContext(): void {
    if (this.contextStack.length > 1) {
      this.contextStack.pop();
    }
  }

  // Get current context
  private getCurrentContext(): UnitContext {
    if (this.contextStack.length === 0) {
      // Default context based on config
      return {
        fontSize: this.config.baseFontSize,
        spacing: this.config.baseSpacing,
        padding: this.config.basePadding,
      };
    }
    return this.contextStack[this.contextStack.length - 1];
  }

  // === Utility methods ===

  // Convert any unit to Three.js units
  toThreeUnits(value: string): number {
    const match = value.match(/^(\d+(?:\.\d+)?)(rem|em|px|vw|vh|srem|prem|sem|pem)$/);
    if (!match) {
      throw new Error(`Invalid unit format: ${value}`);
    }

    const numValue = parseFloat(match[1]);
    const unit = match[2];

    switch (unit) {
      case 'rem':
        return this.rem(numValue);
      case 'em':
        return this.em(numValue);
      case 'px':
        return this.px(numValue);
      case 'vw':
        return this.vw(numValue);
      case 'vh':
        return this.vh(numValue);
      case 'srem':
        return this.srem(numValue);
      case 'prem':
        return this.prem(numValue);
      case 'sem':
        return this.sem(numValue);
      case 'pem':
        return this.pem(numValue);
      default:
        throw new Error(`Unknown unit: ${unit}`);
    }
  }

  // Get debug information
  getDebugInfo(): {
    config: UnitConfig;
    contextStack: UnitContext[];
    currentContext: UnitContext;
  } {
    return {
      config: this.config,
      contextStack: [...this.contextStack],
      currentContext: this.getCurrentContext(),
    };
  }
}

// Context for em-like calculations
export interface UnitContext {
  fontSize: number; // Current font size in pixels
  spacing: number; // Current spacing in pixels
  padding: number; // Current padding in pixels
}

// Default configuration
export const DEFAULT_UNIT_CONFIG: UnitConfig = {
  baseFontSize: 16, // 1rem = 16px (like CSS default)
  baseSpacing: 8, // 1srem = 8px (common spacing unit)
  basePadding: 4, // 1prem = 4px (common padding unit)
};

// Singleton instance
let unitSystemInstance: UnitSystem | null = null;

export function getUnitSystem(): UnitSystem {
  if (!unitSystemInstance) {
    unitSystemInstance = new UnitSystem(DEFAULT_UNIT_CONFIG);
  }
  return unitSystemInstance;
}

export function initializeUnitSystem(config?: Partial<UnitConfig>): UnitSystem {
  const finalConfig = { ...DEFAULT_UNIT_CONFIG, ...config };
  unitSystemInstance = new UnitSystem(finalConfig);
  return unitSystemInstance;
}

// === Utility functions for easy access ===

// Font size units
export function rem(value: number): number {
  return getUnitSystem().rem(value);
}

export function em(value: number): number {
  return getUnitSystem().em(value);
}

// Spacing units
export function srem(value: number): number {
  return getUnitSystem().srem(value);
}

export function sem(value: number): number {
  return getUnitSystem().sem(value);
}

// Padding units
export function prem(value: number): number {
  return getUnitSystem().prem(value);
}

export function pem(value: number): number {
  return getUnitSystem().pem(value);
}

// Absolute and viewport units
export function px(value: number): number {
  return getUnitSystem().px(value);
}

export function vw(value: number): number {
  return getUnitSystem().vw(value);
}

export function vh(value: number): number {
  return getUnitSystem().vh(value);
}

// Context management
export function pushContext(context: Partial<UnitContext>): void {
  getUnitSystem().pushContext(context);
}

export function popContext(): void {
  getUnitSystem().popContext();
}

// String parsing
export function u(value: string): number {
  return getUnitSystem().toThreeUnits(value);
}
