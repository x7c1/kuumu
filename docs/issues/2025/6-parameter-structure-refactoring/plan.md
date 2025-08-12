# Parameter Structure Refactoring Plan

## Overview
Refactor the three-js-layouter-example codebase to consolidate duplicate parameter structures across multiple files, reducing code duplication and improving maintainability.

## Current Situation
The same parameter structure appears in multiple locations:
- `application.ts` - `initialize` method options (lines 43-50)
- `application-state.ts` - `updateFromOptions` method parameter (lines 36-42)
- `build-example.ts` - various example parameter types (lines 31-52)

### Duplicate Properties
- `wireframe?: boolean`
- `heightMode?: 'fixed' | 'dynamic'`
- `example?: ExampleType`
- `horizontalAlignment?: 'center' | 'top'`
- `verticalAlignment?: 'center' | 'left'`
- `projection?: string`

## Goals
- Reduce code duplication by creating shared parameter interfaces
- Maintain existing functionality without breaking changes
- Improve type safety and consistency
- Make future parameter additions easier

## Implementation Approach

### Phase 1: Create Base Types (2 points)
- Create new directory `src/models/`
- Create `src/models/index.ts` with named union types
- Create `src/models/init-params.ts` with `InitParams` interface and constructor function

### Phase 2: Replace Union Type Literals (4 points)
- Replace inline union types in `application.ts` method signatures
- Replace inline union types in `application-state.ts` properties and methods  
- Replace inline union types in `build-example.ts` type definitions
- Replace inline union types in `debug-panel.ts` callbacks and methods
- Replace inline union types in `camera-controller/camera-router.ts`
- Replace inline union types in `main.ts` event handlers

### Phase 3: Update Parameter Interfaces (3 points)
- Refactor `application.ts` initialize method to use `InitParams`
- Update `application-state.ts` updateFromOptions to use `InitParams`
- Rename `ApplicationState` to `ExampleState` (class name and file name)
- Update all references to the renamed class
- Update imports across all affected files

### Phase 4: Validation and Testing (2 points)
- Run existing tests to ensure no regressions
- Verify all parameter passing works correctly
- Test example switching and configuration updates

## Technical Implementation Details

### New Type Structure

File: `src/models/index.ts`
```typescript
// Named union types
export type HorizontalAlignment = 'center' | 'top';
export type VerticalAlignment = 'center' | 'left';
export type ProjectionType = 'orthographic' | 'perspective';
export type HeightMode = 'fixed' | 'dynamic';
```

File: `src/models/init-params.ts`
```typescript
import type { ExampleType } from '../build-example';
import type { HorizontalAlignment, VerticalAlignment, ProjectionType, HeightMode } from './index';

// Application initialization parameters
export interface InitParams {
  example: ExampleType;
  horizontalAlignment: HorizontalAlignment;
  verticalAlignment: VerticalAlignment;
  projection: ProjectionType;
  wireframe: boolean;
  heightMode: HeightMode;
}

// Constructor function for InitParams with defaults
export function createInitParams(overrides: Partial<InitParams> = {}): InitParams {
  return {
    example: 'simple-container',
    horizontalAlignment: 'center',
    verticalAlignment: 'left',
    projection: 'orthographic',
    wireframe: false,
    heightMode: 'dynamic',
    ...overrides,
  };
}
```

### Migration Strategy
- Start with least risky changes (new type definitions)
- Update imports and type annotations incrementally
- Keep all existing method signatures compatible initially
- Gradually consolidate duplicate code

### Specific File Updates

#### `src/application-state.ts` → `src/example-state.ts`

**Before:**
```typescript
export class ApplicationState {
  exampleType: ExampleType = 'simple-container';
  horizontalAlignment: 'center' | 'top' = 'center';
  verticalAlignment: 'center' | 'left' = 'left';
  wireframeEnabled: boolean = false;
  heightMode: 'fixed' | 'dynamic' = 'dynamic';

  updateFromOptions(options: {
    example?: ExampleType;
    horizontalAlignment?: 'center' | 'top';
    verticalAlignment?: 'center' | 'left';
    wireframe?: boolean;
    heightMode?: 'fixed' | 'dynamic';
  }): void { ... }
}
```

**After:**
```typescript
import type { HorizontalAlignment, VerticalAlignment, HeightMode } from './models/index';
import type { InitParams } from './models/init-params';

export class ExampleState {
  exampleType: ExampleType = 'simple-container';
  horizontalAlignment: HorizontalAlignment = 'center';
  verticalAlignment: VerticalAlignment = 'left';
  wireframeEnabled: boolean = false;
  heightMode: HeightMode = 'dynamic';

  updateFromOptions(options: Partial<InitParams>): void {
    if (options.example) {
      this.exampleType = options.example;
    }
    if (options.horizontalAlignment) {
      this.horizontalAlignment = options.horizontalAlignment;
    }
    if (options.verticalAlignment) {
      this.verticalAlignment = options.verticalAlignment;
    }
    if (options.wireframe !== undefined) {
      this.wireframeEnabled = options.wireframe;
    }
    if (options.heightMode) {
      this.heightMode = options.heightMode;
    }
    // Note: projection is not handled here as it's camera-specific
  }
}
```

## Risk Mitigation
- Maintain backward compatibility during transition
- Test each phase independently
- Use TypeScript compiler to catch type mismatches
- Keep changes small and focused

## Success Criteria
- Zero functional regressions
- Significant reduction in duplicate parameter definitions
- Improved type consistency across the codebase
- Easier future parameter additions

## Timeline
Total estimated effort: 11 points

- Phase 1: 2 points
- Phase 2: 4 points  
- Phase 3: 3 points
- Phase 4: 2 points

## Notes
This refactoring maintains the existing API surface while consolidating internal implementations. All public methods continue to work as before, but with reduced code duplication underneath.
