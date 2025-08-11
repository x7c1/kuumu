import type { Font } from 'three/examples/jsm/loaders/FontLoader.js';
import type { ExampleParams, ExampleType } from './build-example';

export class ApplicationState {
  exampleType: ExampleType = 'simple-container';
  horizontalAlignment: 'center' | 'top' = 'center';
  verticalAlignment: 'center' | 'left' = 'left';
  wireframeEnabled: boolean = false;
  heightMode: 'fixed' | 'dynamic' = 'dynamic';

  createExampleParams(font: Font): ExampleParams {
    const baseParams = {
      font,
      wireframe: this.wireframeEnabled,
      heightMode: this.heightMode,
    };

    switch (this.exampleType) {
      case 'simple-container':
        return { type: 'simple-container', ...baseParams };
      case 'simple-horizontal':
        return {
          type: 'simple-horizontal',
          ...baseParams,
          alignment: this.horizontalAlignment,
        };
      case 'simple-vertical':
        return {
          type: 'simple-vertical',
          ...baseParams,
          verticalAlignment: this.verticalAlignment,
        };
    }
  }

  updateFromOptions(options: {
    example?: ExampleType;
    horizontalAlignment?: 'center' | 'top';
    verticalAlignment?: 'center' | 'left';
    wireframe?: boolean;
    heightMode?: 'fixed' | 'dynamic';
  }): void {
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
  }
}
