import {
  getScalingSystem,
  initializeScalingSystem,
  initializeUnitSystem,
} from '@kuumu/layouter/scaling';
import { isGroupFactoryError } from '@kuumu/three-js-layouter/group-factory';
import type { Group } from 'three';
import * as THREE from 'three';
import type { Font } from 'three/examples/jsm/loaders/FontLoader.js';
import { buildExample, type ExampleParams, type ExampleType } from './build-example';
import { type CameraConfig, CameraController, type ZoomConfig } from './camera-controller';
import { loadFont } from './load-font';
import { type SceneConfig, SceneManager } from './scene-manager';

export interface ApplicationConfig {
  scene: SceneConfig;
  camera: CameraConfig;
  zoom: ZoomConfig;
}

// Base orthographic camera size constant
const BASE_ORTHOGRAPHIC_SIZE = 50;

export class Application {
  private sceneManager: SceneManager;
  private cameraController: CameraController;
  private config: ApplicationConfig;
  private currentExampleType: ExampleType = 'simple-container';
  private currentAlignment: 'center' | 'top' = 'center';
  private wireframeEnabled: boolean = false;
  private currentHeightMode: 'fixed' | 'dynamic' = 'dynamic';

  constructor(config: ApplicationConfig, container: HTMLElement) {
    this.config = config;
    this.sceneManager = new SceneManager(config.scene, container);

    // Initialize scaling system
    const scalingSystem = initializeScalingSystem();

    // Initialize unit system
    initializeUnitSystem();

    // Default to orthographic camera if no projection is specified
    // Scale the camera size inversely to maintain consistent visual size
    const orthographicSize = BASE_ORTHOGRAPHIC_SIZE / scalingSystem.getScaleFactor();
    const defaultCameraConfig = {
      ...config.camera,
      size: orthographicSize,
    };
    this.cameraController = new CameraController(defaultCameraConfig, config.zoom);
    this.cameraController.setupEventListeners();

    // Update scaling when window resizes
    this.setupResizeListener();
  }

  async initialize(options?: {
    example?: ExampleType;
    alignment?: 'center' | 'top';
    projection?: string;
    wireframe?: boolean;
    heightMode?: 'fixed' | 'dynamic';
  }): Promise<void> {
    const font = await loadFont();
    if (!font) {
      throw new Error('Failed to load font');
    }

    // Set initial values if provided
    if (options?.example) {
      this.currentExampleType = options.example;
    }
    if (options?.alignment) {
      this.currentAlignment = options.alignment;
    }
    if (options?.projection) {
      this.switchProjection(options.projection);
    }
    if (options?.wireframe !== undefined) {
      this.switchWireframe(options.wireframe);
    }
    if (options?.heightMode) {
      this.currentHeightMode = options.heightMode;
    }

    // Load initial example
    await this.loadCurrentExample();

    this.setupCameraCallbacks();
    this.sceneManager.startRenderLoop(this.cameraController.camera);

    // Fix TextNode rendering issue by forcing a complete render cycle
    this.forceInitialRender();

    this.logDebugInfo();
  }

  async switchExample(exampleType: ExampleType): Promise<void> {
    this.currentExampleType = exampleType;
    await this.loadCurrentExample();
    this.logDebugInfo();
  }

  async switchAlignment(alignment: 'center' | 'top'): Promise<void> {
    this.currentAlignment = alignment;
    await this.loadCurrentExample();
    this.logDebugInfo();
  }

  switchProjection(projection: string): void {
    const currentCamera = this.cameraController.camera;
    const currentPosition = currentCamera.position.clone();

    // Use fixed, stable values to prevent accumulation of rounding errors
    const STANDARD_ORTHOGRAPHIC_SIZE = 50;
    const STANDARD_PERSPECTIVE_DISTANCE = 50;
    const STANDARD_FOV = 50;

    // Preserve X,Y position (pan state) while adjusting Z for projection type
    const finalPosition = currentPosition.clone();
    let cameraSpecificConfig: { fov?: number; size?: number };

    if (projection === 'orthographic') {
      // For perspective → orthographic: preserve X,Y, set optimal Z
      finalPosition.z = STANDARD_PERSPECTIVE_DISTANCE;

      cameraSpecificConfig = { size: STANDARD_ORTHOGRAPHIC_SIZE, fov: undefined };

      console.log(
        '[PROJECTION_SWITCH] → Orthographic: preserving X,Y =',
        finalPosition.x,
        finalPosition.y,
        'setting Z =',
        finalPosition.z
      );
    } else {
      // For orthographic → perspective: preserve X,Y, set optimal Z
      finalPosition.z = STANDARD_PERSPECTIVE_DISTANCE;

      cameraSpecificConfig = { fov: STANDARD_FOV, size: undefined };

      console.log(
        '[PROJECTION_SWITCH] → Perspective: preserving X,Y =',
        finalPosition.x,
        finalPosition.y,
        'setting Z =',
        finalPosition.z
      );
    }

    // Create base config with current position for camera placement
    const baseConfigWithCurrentPosition = {
      ...this.config.camera,
      position: {
        x: finalPosition.x,
        y: finalPosition.y,
        z: finalPosition.z,
      },
    };

    // Create standard initial config for reset functionality
    const standardInitialConfig = {
      ...this.config.camera,
      position: { x: 0, y: 0, z: STANDARD_PERSPECTIVE_DISTANCE },
      ...cameraSpecificConfig,
    };

    this.cameraController = this.cameraController.preservePositionAndRecreate(
      baseConfigWithCurrentPosition,
      this.config.zoom,
      cameraSpecificConfig
    );

    // Update the camera controller's initial config to standard values
    this.updateCameraInitialConfig(standardInitialConfig);

    // Preserve camera orientation - look at the same relative target
    // Calculate where the camera was looking based on current position
    const currentDirection = new THREE.Vector3();
    currentCamera.getWorldDirection(currentDirection);
    const lookTarget = currentPosition.clone().add(currentDirection.multiplyScalar(50));

    this.cameraController.camera.lookAt(lookTarget);

    console.log('[PROJECTION_SWITCH] New camera type:', this.cameraController.camera.type);
    console.log('[PROJECTION_SWITCH] New camera position:', this.cameraController.camera.position);

    this.setupCameraCallbacks();
    this.sceneManager.startRenderLoop(this.cameraController.camera);
    this.sceneManager.requestRender();

    // Fix TextNode rendering issue after projection switch
    this.forceInitialRender();
  }

  private updateCameraInitialConfig(
    standardConfig: CameraConfig & { fov?: number; size?: number }
  ): void {
    // Update the camera controller's initial config
    this.cameraController.updateInitialConfig(standardConfig);
  }

  async switchWireframe(enabled: boolean): Promise<void> {
    this.wireframeEnabled = enabled;
    await this.loadCurrentExample();
  }

  async switchHeightMode(heightMode: 'fixed' | 'dynamic'): Promise<void> {
    console.log(`[APP] Switching height mode to: ${heightMode}`);
    this.currentHeightMode = heightMode;
    await this.loadCurrentExample();
  }

  switchAxisHelper(show: boolean): void {
    console.log('[APP] switchAxisHelper called with:', show);
    this.sceneManager.showAxisHelper(show);
  }

  showRotationCenter(position: THREE.Vector3): void {
    this.sceneManager.showRotationCenter(position, this.cameraController.camera);
  }

  hideRotationCenter(): void {
    this.sceneManager.hideRotationCenter();
  }

  updateRotationCenterScale(): void {
    this.sceneManager.updateRotationCenterScalePublic(this.cameraController.camera);
  }

  private async loadCurrentExample(): Promise<void> {
    const font = await loadFont();
    if (!font) {
      console.error('Failed to load font');
      return;
    }

    this.sceneManager.clearScene();

    try {
      const params = this.createExampleParams(font);
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

  private createExampleParams(font: Font): ExampleParams {
    const baseParams = {
      font,
      wireframe: this.wireframeEnabled,
      heightMode: this.currentHeightMode,
    };

    switch (this.currentExampleType) {
      case 'simple-container':
        return { type: 'simple-container', ...baseParams };
      case 'simple-horizontal':
        return { type: 'simple-horizontal', ...baseParams, alignment: this.currentAlignment };
      case 'simple-vertical':
        return { type: 'simple-vertical', ...baseParams };
    }
  }

  private logDebugInfo(): void {
    console.log('Current example:', this.currentExampleType);
    console.log('Scene objects:', this.sceneManager.scene.children.length);
  }

  private setupCameraCallbacks(): void {
    this.cameraController.setRenderCallback(() => this.sceneManager.requestRender());
    this.cameraController.setContinuousRenderCallback((enabled) =>
      this.sceneManager.setContinuousRender(enabled)
    );
    this.cameraController.setRotationCenterCallback(
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
    if (this.cameraController.camera.type === 'OrthographicCamera') {
      const orthoCamera = this.cameraController.camera as THREE.OrthographicCamera;
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

      // Small zoom in only
      const wheelEvent = new WheelEvent('wheel', {
        deltaY: -1, // Zoom in
        clientX: canvas.width / 2,
        clientY: canvas.height / 2,
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
    this.cameraController.dispose();
  }
}
