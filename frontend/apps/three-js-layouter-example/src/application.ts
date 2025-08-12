import {
  getScalingSystem,
  initializeScalingSystem,
  initializeUnitSystem,
} from '@kuumu/layouter/scaling';
import type * as THREE from 'three';
import { ApplicationState } from './application-state';
import type { ExampleType } from './build-example';
import { type CameraControllerConfig, CameraRouter, type ZoomConfig } from './camera-controller';
import { ExampleLoader } from './example-loader';
import { loadFont } from './load-font';
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
  private state: ApplicationState;
  private exampleLoader: ExampleLoader;

  constructor(config: ApplicationConfig, container: HTMLElement) {
    this.config = config;
    this.sceneManager = new SceneManager(config.scene, container);
    this.state = new ApplicationState();
    this.exampleLoader = new ExampleLoader(this.state, this.sceneManager);

    // Initialize scaling system
    initializeScalingSystem();

    // Initialize unit system
    initializeUnitSystem();

    // Update scaling when window resizes
    this.setupResizeListener();
  }

  async initialize(options?: {
    example?: ExampleType;
    horizontalAlignment?: 'center' | 'top';
    verticalAlignment?: 'center' | 'left';
    projection?: string;
    wireframe?: boolean;
    heightMode?: 'fixed' | 'dynamic';
  }): Promise<void> {
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

    // Set initial values if provided
    if (options) {
      this.state.updateFromOptions(options);
    }

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

  async switchHorizontalAlignment(horizontalAlignment: 'center' | 'top'): Promise<void> {
    this.state.horizontalAlignment = horizontalAlignment;
    await this.exampleLoader.reload();
    this.logDebugInfo();
  }

  async switchVerticalAlignment(verticalAlignment: 'center' | 'left'): Promise<void> {
    this.state.verticalAlignment = verticalAlignment;
    await this.exampleLoader.reload();
    this.logDebugInfo();
  }

  switchProjection(projection: 'orthographic' | 'perspective'): void {
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

  async switchHeightMode(heightMode: 'fixed' | 'dynamic'): Promise<void> {
    console.log(`[APP] Switching height mode to: ${heightMode}`);
    this.state.heightMode = heightMode;
    await this.exampleLoader.reload();
  }

  switchAxisHelper(show: boolean): void {
    console.log('[APP] switchAxisHelper called with:', show);
    this.sceneManager.showAxisHelper(show);
  }

  showRotationCenter(position: THREE.Vector3): void {
    this.sceneManager.showRotationCenter(position, this.cameraRouter.camera);
  }

  hideRotationCenter(): void {
    this.sceneManager.hideRotationCenter();
  }

  updateRotationCenterScale(): void {
    this.sceneManager.updateRotationCenterScalePublic(this.cameraRouter.camera);
  }

  private logDebugInfo(): void {
    console.log('Current example:', this.state.exampleType);
    console.log('Scene objects:', this.sceneManager.scene.children.length);
  }

  private setupCameraCallbacks(): void {
    this.cameraRouter.setRenderCallback(() => this.sceneManager.requestRender());
    this.cameraRouter.setContinuousRenderCallback((enabled) =>
      this.sceneManager.setContinuousRender(enabled)
    );
    this.cameraRouter.setRotationCenterCallback(
      (position) => this.showRotationCenter(position),
      () => this.hideRotationCenter(),
      () => this.updateRotationCenterScale()
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
        this.cameraRouter.updateCameraSize();
        this.exampleLoader.reload();
      }
    };

    window.addEventListener('resize', handleResize);

    // Store the handler for cleanup
    this.resizeHandler = handleResize;
  }

  private forceInitialRender(): void {
    // Fix TextNode rendering issue by simulating actual mouse wheel events
    // Since manual zoom works, let's dispatch real wheel events to the DOM

    setTimeout(() => {
      // Create and dispatch a real wheel event on the canvas element
      const canvas = this.sceneManager.renderer.domElement;

      // Use canvas dimensions and position for precise center coordinates
      const canvasRect = canvas.getBoundingClientRect();
      const centerX = canvasRect.left + canvasRect.width / 2;
      const centerY = canvasRect.top + canvasRect.height / 2;

      // Small zoom in only
      const wheelEvent = new WheelEvent('wheel', {
        deltaY: -1, // Zoom in
        clientX: centerX,
        clientY: centerY,
        bubbles: true,
        cancelable: true,
        view: window,
      });

      // Dispatch the event to the canvas
      canvas.dispatchEvent(wheelEvent);
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
