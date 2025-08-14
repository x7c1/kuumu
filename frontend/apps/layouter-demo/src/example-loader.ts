import { isGroupFactoryError } from '@kuumu/three-js-layouter/group-factory';
import { buildExample } from './build-example';
import type { ExampleState } from './example-state';
import { loadFont } from './load-font';
import type { SceneManager } from './scene-manager';

export class ExampleLoader {
  private state: ExampleState;
  private sceneManager: SceneManager;

  constructor(state: ExampleState, sceneManager: SceneManager) {
    this.state = state;
    this.sceneManager = sceneManager;
  }

  async reload(): Promise<void> {
    const font = await loadFont();
    if (!font) {
      console.error('Failed to load font');
      return;
    }

    this.sceneManager.clearScene();

    try {
      const params = this.state.createExampleParams(font);
      const groupResult = buildExample(params);

      if (isGroupFactoryError(groupResult)) {
        console.error('Failed to create node group:', groupResult);
        return;
      }

      this.sceneManager.centerAndAddToScene(groupResult);
    } catch (err) {
      console.error('Error loading example:', err);
    }
  }
}
