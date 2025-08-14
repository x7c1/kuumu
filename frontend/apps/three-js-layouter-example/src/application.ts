import {
  getScalingSystem,
  initializeScalingSystem,
  initializeUnitSystem,
} from '@kuumu/layouter/scaling';
import type { ExampleType } from './build-example';
import { type CameraControllerConfig, CameraRouter, type ZoomConfig } from './camera-controller';
import { ExampleLoader } from './example-loader';
import { ExampleState } from './example-state';
import { loadFont } from './load-font';
import type { HeightMode, HorizontalAlignment, ProjectionType, VerticalAlignment } from './models';
import type { InitParams } from './models/init-params';
import { type SceneConfig, SceneManager } from './scene-manager';

export interface ApplicationConfig {
  scene: SceneConfig;
  camera: CameraControllerConfig;
  zoom: ZoomConfig;
}

export class Application {
  private sceneManager: SceneManager;
  private cameraRouter!: CameraRouter;
  private config: ApplicationConfig;
  private state: ExampleState;
  private exampleLoader: ExampleLoader;

  constructor(config: ApplicationConfig, container: HTMLElement) {
    this.config = config;
    this.sceneManager = new SceneManager(config.scene, container);
    this.state = new ExampleState();
    this.exampleLoader = new ExampleLoader(this.state, this.sceneManager);

    // Initialize scaling system
    initializeScalingSystem();

    // Initialize unit system
    initializeUnitSystem();

    // Update scaling when window resizes
    this.setupResizeListener();
  }

  async initialize(options: Partial<InitParams>): Promise<void> {
    const font = await loadFont();
    if (!font) {
      throw new Error('Failed to load font');
    }

    // Initialize camera with projection preference
    this.cameraRouter = CameraRouter.createWithProjectionPreference(
      this.config.camera,
      this.config.zoom,
      options?.projection
    );

    // Set initial values
    this.state.updateFromOptions(options);

    // Load initial example
    await this.exampleLoader.reload();

    this.setupCameraCallbacks();
    this.sceneManager.startRenderLoop(this.cameraRouter.camera);

    // Fix TextNode rendering issue by forcing a complete render cycle
    this.forceInitialRender();

    this.logDebugInfo();
  }

  async switchExample(exampleType: ExampleType): Promise<void> {
    this.state.exampleType = exampleType;
    await this.exampleLoader.reload();
    this.logDebugInfo();
  }

  async switchHorizontalAlignment(horizontalAlignment: HorizontalAlignment): Promise<void> {
    this.state.horizontalAlignment = horizontalAlignment;
    await this.exampleLoader.reload();
    this.logDebugInfo();
  }

  async switchVerticalAlignment(verticalAlignment: VerticalAlignment): Promise<void> {
    this.state.verticalAlignment = verticalAlignment;
    await this.exampleLoader.reload();
    this.logDebugInfo();
  }

  switchProjection(projection: ProjectionType): void {
    this.cameraRouter.switchProjection(projection, {
      camera: this.config.camera,
      zoom: this.config.zoom,
    });

    this.setupCameraCallbacks();
    this.sceneManager.startRenderLoop(this.cameraRouter.camera);
    this.sceneManager.requestRender();

    // Fix TextNode rendering issue after projection switch
    this.forceInitialRender();
  }

  async switchWireframe(enabled: boolean): Promise<void> {
    this.state.wireframeEnabled = enabled;
    await this.exampleLoader.reload();
  }

  async switchHeightMode(heightMode: HeightMode): Promise<void> {
    console.log(`[APP] Switching height mode to: ${heightMode}`);
    this.state.heightMode = heightMode;
    await this.exampleLoader.reload();
  }

  switchAxisHelper(show: boolean): void {
    console.log('[APP] switchAxisHelper called with:', show);
    this.sceneManager.showAxisHelper(show);
  }

  private logDebugInfo(): void {
    console.log('Current example:', this.state.exampleType);
    console.log('Scene objects:', this.sceneManager.scene.children.length);
  }

  private setupCameraCallbacks(): void {
    this.cameraRouter.setRenderCallback(() => {
      this.sceneManager.requestRender();
    });
    this.cameraRouter.setContinuousRenderCallback((enabled) => {
      this.sceneManager.setContinuousRender(enabled);
    });
    this.cameraRouter.setRotationCenterCallback(
      (position) => {
        this.sceneManager.showRotationCenter(position, this.cameraRouter.camera);
      },
      () => {
        this.sceneManager.hideRotationCenter();
      },
      () => {
        this.sceneManager.updateRotationCenterScalePublic(this.cameraRouter.camera);
      }
    );
  }

  private setupResizeListener(): void {
    const handleResize = () => {
      const scalingSystem = getScalingSystem();
      const oldScaleFactor = scalingSystem.getScaleFactor();

      scalingSystem.updateViewport();

      const newScaleFactor = scalingSystem.getScaleFactor();

      // Only update camera and reload if scale factor actually changed (DPI change)
      if (oldScaleFactor !== newScaleFactor) {
        this.exampleLoader.reload();
      }
    };

    window.addEventListener('resize', handleResize);

    // Store the handler for cleanup
    this.resizeHandler = handleResize;
  }

  private forceInitialRender(): void {
    // Fix TextNode rendering issue by dispatching a mousemove event
    // Simply triggering the event handler is sufficient to resolve rendering problems
    setTimeout(() => {
      const canvas = this.sceneManager.renderer.domElement;
      const canvasRect = canvas.getBoundingClientRect();
      const centerX = canvasRect.left + canvasRect.width / 2;
      const centerY = canvasRect.top + canvasRect.height / 2;

      const mouseMoveEvent1 = new MouseEvent('mousemove', {
        clientX: centerX,
        clientY: centerY,
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
        view: window,
      });
      // HACK: Must dispatch twice - single event is not enough. This is a terrible workaround.
      document.dispatchEvent(mouseMoveEvent1);
      document.dispatchEvent(mouseMoveEvent1);
    }, 0);
  }

  private resizeHandler?: () => void;

  dispose(): void {
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }
    this.sceneManager.dispose();
    this.cameraRouter.dispose();
  }
}
