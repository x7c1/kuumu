import * as THREE from 'three';
import { RotationCenterIndicator } from './rotation-center-indicator';

export interface SceneConfig {
  width: number;
  height: number;
  clearColor: number;
  antialias: boolean;
}

export class SceneManager {
  public readonly scene: THREE.Scene;
  public readonly renderer: THREE.WebGLRenderer;
  private animationId: number | null = null;
  private needsRender = true;
  private continuousRender = false;
  private axisHelper: THREE.AxesHelper | null = null;
  private axisWireframeCube: THREE.Mesh | null = null;
  private rotationCenterIndicator: RotationCenterIndicator;

  constructor(config: SceneConfig, container: HTMLElement) {
    this.scene = new THREE.Scene();
    this.renderer = this.createRenderer(config);

    this.renderer.setSize(config.width, config.height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setClearColor(config.clearColor, 0);
    container.appendChild(this.renderer.domElement);

    // Initialize rotation center indicator
    this.rotationCenterIndicator = new RotationCenterIndicator(this.scene);

    // Add axis helper by default
    this.showAxisHelper(true);

    // Handle WebGL context loss/restore
    this.renderer.domElement.addEventListener('webglcontextlost', (event) => {
      console.warn('WebGL context lost');
      event.preventDefault();
      this.stopRenderLoop();
    });

    this.renderer.domElement.addEventListener('webglcontextrestored', () => {
      console.log('WebGL context restored');
      this.renderer.setSize(config.width, config.height);
      this.renderer.setPixelRatio(window.devicePixelRatio);
      this.renderer.setClearColor(config.clearColor, 0);
    });
  }

  private createRenderer(config: SceneConfig): THREE.WebGLRenderer {
    // WebGL context creation can fail after system sleep/wake cycles.
    // Try multiple fallback configurations with progressively relaxed requirements.
    const fallbackConfigs = [
      { antialias: config.antialias, alpha: true },
      { antialias: config.antialias, preserveDrawingBuffer: true, alpha: true },
      { antialias: false, preserveDrawingBuffer: true, alpha: true },
      {
        antialias: false,
        preserveDrawingBuffer: true,
        failIfMajorPerformanceCaveat: false,
        alpha: true,
      },
    ];

    for (const [index, rendererConfig] of fallbackConfigs.entries()) {
      try {
        return new THREE.WebGLRenderer(rendererConfig);
      } catch (err) {
        if (index === fallbackConfigs.length - 1) {
          throw new Error(
            `Failed to create WebGL renderer after ${fallbackConfigs.length} attempts: ${err}`
          );
        }
        console.warn(`WebGL renderer attempt ${index + 1} failed, trying fallback:`, err);
      }
    }

    throw new Error('Unreachable code');
  }

  startRenderLoop(camera: THREE.Camera): void {
    // Stop any existing render loop first
    this.stopRenderLoop();

    const animate = (): void => {
      this.animationId = requestAnimationFrame(animate);
      if (this.continuousRender || this.needsRender) {
        this.renderer.render(this.scene, camera);
        this.needsRender = false;
      }
    };
    animate();
  }

  requestRender(): void {
    this.needsRender = true;
  }

  setContinuousRender(enabled: boolean): void {
    this.continuousRender = enabled;
  }

  stopRenderLoop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  handleResize(width: number, height: number): void {
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
  }

  showAxisHelper(show: boolean): void {
    if (show && !this.axisHelper) {
      // Create axis helper with size 10
      this.axisHelper = new THREE.AxesHelper(10);
      this.scene.add(this.axisHelper);

      // Create wireframe cube around axis helper
      const cubeGeometry = new THREE.BoxGeometry(20, 20, 20);
      const cubeMaterial = new THREE.MeshBasicMaterial({
        color: 0x444444,
        wireframe: true,
        transparent: false,
        depthTest: true,
        depthWrite: true,
      });
      this.axisWireframeCube = new THREE.Mesh(cubeGeometry, cubeMaterial);
      this.axisWireframeCube.position.set(0, 0, 0);
      this.scene.add(this.axisWireframeCube);

      this.requestRender();
    } else if (!show && this.axisHelper) {
      this.scene.remove(this.axisHelper);
      this.axisHelper = null;

      if (this.axisWireframeCube) {
        this.scene.remove(this.axisWireframeCube);
        this.axisWireframeCube = null;
      }

      this.requestRender();
    }
  }

  clearScene(): void {
    // Clear scene but preserve axis helper and rotation center indicator
    const axisHelperState = !!this.axisHelper;
    this.scene.clear();
    this.axisHelper = null; // Reset reference since scene.clear() removed it
    this.axisWireframeCube = null; // Reset wireframe cube reference too

    // Recreate rotation center indicator after scene clear
    this.rotationCenterIndicator = new RotationCenterIndicator(this.scene);

    // Restore axis helper if it was shown
    if (axisHelperState) {
      this.showAxisHelper(true);
    }
  }

  showRotationCenter(position: THREE.Vector3, camera: THREE.Camera): void {
    this.rotationCenterIndicator.show(position, camera);
    this.requestRender();
  }

  hideRotationCenter(): void {
    this.rotationCenterIndicator.hide();
    this.requestRender();
  }

  updateRotationCenterScalePublic(camera: THREE.Camera): void {
    this.rotationCenterIndicator.updateScale(camera);
    this.requestRender();
  }

  dispose(): void {
    this.stopRenderLoop();
    this.rotationCenterIndicator.dispose();
    this.renderer.dispose();
  }
}
