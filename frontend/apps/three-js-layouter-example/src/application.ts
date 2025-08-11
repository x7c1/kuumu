import {
  getScalingSystem,
  initializeScalingSystem,
  initializeUnitSystem,
} from '@kuumu/layouter/scaling';
import { isGroupFactoryError } from '@kuumu/three-js-layouter/group-factory';
import type { Group } from 'three';
import * as THREE from 'three';
import { ApplicationState } from './application-state';
import { buildExample, type ExampleType } from './build-example';
import {
  type CameraControllerConfig,
  CameraRouter,
  type OrthographicCameraConfig,
  type PerspectiveCameraConfig,
  type ZoomConfig,
} from './camera-controller';
import { loadFont } from './load-font';
import { type SceneConfig, SceneManager } from './scene-manager';

export interface ApplicationConfig {
  scene: SceneConfig;
  camera: CameraControllerConfig;
  zoom: ZoomConfig;
}

// Base orthographic camera size constant
const BASE_ORTHOGRAPHIC_SIZE = 50;

export class Application {
  private sceneManager: SceneManager;
  private cameraRouter!: CameraRouter;
  private config: ApplicationConfig;
  private state: ApplicationState;

  constructor(config: ApplicationConfig, container: HTMLElement) {
    this.config = config;
    this.sceneManager = new SceneManager(config.scene, container);
    this.state = new ApplicationState();

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
    this.initializeCamera(options?.projection);

    // Set initial values if provided
    if (options) {
      this.state.updateFromOptions(options);
    }

    // Load initial example
    await this.loadCurrentExample();

    this.setupCameraCallbacks();
    this.sceneManager.startRenderLoop(this.cameraRouter.camera);

    // Fix TextNode rendering issue by forcing a complete render cycle
    this.forceInitialRender();

    this.logDebugInfo();
  }

  private initializeCamera(projection?: string): void {
    const scalingSystem = getScalingSystem();

    // Use fixed, stable values to prevent accumulation of rounding errors
    const STANDARD_ORTHOGRAPHIC_SIZE = BASE_ORTHOGRAPHIC_SIZE / scalingSystem.getScaleFactor();
    const STANDARD_PERSPECTIVE_DISTANCE = 50;
    const STANDARD_FOV = 50;

    // Create base config without size or fov to avoid conflicts
    const baseConfig = {
      aspect: this.config.camera.aspect,
      near: this.config.camera.near,
      far: this.config.camera.far,
      position: { x: 0, y: 0, z: STANDARD_PERSPECTIVE_DISTANCE },
    };

    let cameraConfig: CameraControllerConfig;

    if (projection === 'perspective') {
      cameraConfig = {
        ...baseConfig,
        fov: STANDARD_FOV,
      } as PerspectiveCameraConfig;
      console.log('[CAMERA_INIT] Initializing with perspective camera');
    } else {
      // Default to orthographic
      cameraConfig = {
        ...baseConfig,
        size: STANDARD_ORTHOGRAPHIC_SIZE,
      } as OrthographicCameraConfig;
      console.log('[CAMERA_INIT] Initializing with orthographic camera');
    }

    console.log('[CAMERA_INIT] Final config:', cameraConfig);
    this.cameraRouter = new CameraRouter(cameraConfig, this.config.zoom);
    this.cameraRouter.setupEventListeners();
  }

  async switchExample(exampleType: ExampleType): Promise<void> {
    this.state.exampleType = exampleType;
    await this.loadCurrentExample();
    this.logDebugInfo();
  }

  async switchHorizontalAlignment(horizontalAlignment: 'center' | 'top'): Promise<void> {
    this.state.horizontalAlignment = horizontalAlignment;
    await this.loadCurrentExample();
    this.logDebugInfo();
  }

  async switchVerticalAlignment(verticalAlignment: 'center' | 'left'): Promise<void> {
    this.state.verticalAlignment = verticalAlignment;
    await this.loadCurrentExample();
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
    await this.loadCurrentExample();
  }

  async switchHeightMode(heightMode: 'fixed' | 'dynamic'): Promise<void> {
    console.log(`[APP] Switching height mode to: ${heightMode}`);
    this.state.heightMode = heightMode;
    await this.loadCurrentExample();
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

  private async loadCurrentExample(): Promise<void> {
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

      this.centerAndAddToScene(groupResult);
    } catch (err) {
      console.error('Error loading example:', err);
    }
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

  private centerAndAddToScene(group: Group): void {
    const box = new THREE.Box3().setFromObject(group);
    const center = box.getCenter(new THREE.Vector3());

    console.log('[DEBUG] Object bounding box:', box);
    console.log('[DEBUG] Object center before positioning:', center);

    group.position.sub(center);

    console.log('[DEBUG] Object position after centering:', group.position);
    console.log('[DEBUG] Object children count:', group.children.length);

    // Log first few children positions
    group.children.forEach((child, index) => {
      if (index < 3) {
        console.log(`[DEBUG] Child ${index} position:`, child.position);
        console.log(`[DEBUG] Child ${index} type:`, child.type);
      }
    });

    this.sceneManager.scene.add(group);
    this.sceneManager.requestRender();
  }

  private setupResizeListener(): void {
    const handleResize = () => {
      const scalingSystem = getScalingSystem();
      const oldScaleFactor = scalingSystem.getScaleFactor();

      scalingSystem.updateViewport();

      const newScaleFactor = scalingSystem.getScaleFactor();

      // Only update camera and reload if scale factor actually changed (DPI change)
      if (oldScaleFactor !== newScaleFactor) {
        this.updateCameraSize();
        this.loadCurrentExample();
      }
    };

    window.addEventListener('resize', handleResize);

    // Store the handler for cleanup
    this.resizeHandler = handleResize;
  }

  private updateCameraSize(): void {
    const scalingSystem = getScalingSystem();
    const newOrthographicSize = BASE_ORTHOGRAPHIC_SIZE / scalingSystem.getScaleFactor();

    // Update camera size if using orthographic projection
    if (this.cameraRouter.camera.type === 'OrthographicCamera') {
      const orthoCamera = this.cameraRouter.camera as THREE.OrthographicCamera;
      const aspect = orthoCamera.right / orthoCamera.top;

      orthoCamera.left = (-newOrthographicSize * aspect) / 2;
      orthoCamera.right = (newOrthographicSize * aspect) / 2;
      orthoCamera.top = newOrthographicSize / 2;
      orthoCamera.bottom = -newOrthographicSize / 2;
      orthoCamera.updateProjectionMatrix();
    }
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
