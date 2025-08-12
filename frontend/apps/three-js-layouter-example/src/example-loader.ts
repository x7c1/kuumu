import { isGroupFactoryError } from '@kuumu/three-js-layouter/group-factory';
import type { ApplicationState } from './application-state';
import { buildExample } from './build-example';
import { loadFont } from './load-font';
import type { SceneManager } from './scene-manager';

export class ExampleLoader {
  private state: ApplicationState;
  private sceneManager: SceneManager;

  constructor(state: ApplicationState, sceneManager: SceneManager) {
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

