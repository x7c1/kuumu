import type { Font } from 'three/examples/jsm/loaders/FontLoader.js';
import type { ExampleParams, ExampleType } from './build-example';
import type { HeightMode, HorizontalAlignment, VerticalAlignment } from './models';
import type { InitParams } from './models/init-params';

export class ExampleState {
  exampleType: ExampleType = 'simple-container';
  horizontalAlignment: HorizontalAlignment = 'center';
  verticalAlignment: VerticalAlignment = 'left';
  wireframeEnabled: boolean = false;
  heightMode: HeightMode = 'dynamic';

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
  }
}
