import type { ExampleType } from '../build-example';
import type { HeightMode, HorizontalAlignment, ProjectionType, VerticalAlignment } from './index';

export interface InitParams {
  example: ExampleType;
  horizontalAlignment: HorizontalAlignment;
  verticalAlignment: VerticalAlignment;
  projection: ProjectionType;
  wireframe: boolean;
  heightMode: HeightMode;
}

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
