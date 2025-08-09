import { DevLogger } from '@kuumu/dev-logger';
import { getScalingSystem, getUnitSystem } from '@kuumu/layouter/scaling';
import { Application } from './application';
import { type ExampleType, isValidExampleType } from './build-example';
import { DebugPanel } from './debug-panel';

// Initialize DevLogger for AI analysis
DevLogger.initialize({
  endpoint: '/dev-logger/logs',
});

console.info('Dev Logger initialized for AI analysis');

const container = document.getElementById('container');
if (!container) {
  throw new Error('Container element not found');
}

const config = {
  scene: {
    width: window.innerWidth,
    height: window.innerHeight,
    clearColor: 0x0a0a0a,
    antialias: true,
  },
  camera: {
    aspect: window.innerWidth / window.innerHeight,
    near: 0.01,
    far: 200,
    position: { x: 0, y: 0, z: 50 },
  },
  zoom: {
    // Maximum zoom in (smaller number = more zoomed in)
    min: 1,

    // Maximum zoom out (larger number = more zoomed out)
    max: 100,

    // 20% change per wheel scroll
    sensitivity: 0.2,
  },
};

const app = new Application(config, container);

// Add scaling debug info to the page
const addScalingDebugInfo = () => {
  const scalingSystem = getScalingSystem();

  const debugContainer = document.createElement('div');
  debugContainer.style.position = 'fixed';
  debugContainer.style.bottom = '10px';
  debugContainer.style.right = '10px';
  debugContainer.style.background = 'rgba(0, 0, 0, 0.8)';
  debugContainer.style.color = 'white';
  debugContainer.style.padding = '10px';
  debugContainer.style.borderRadius = '5px';
  debugContainer.style.fontSize = '12px';
  debugContainer.style.fontFamily = 'monospace';
  debugContainer.style.zIndex = '1000';

  const updateDebugInfo = () => {
    const info = scalingSystem.getDebugInfo();
    const unitSystem = getUnitSystem();
    const unitInfo = unitSystem.getDebugInfo();

    debugContainer.innerHTML = `
      <div><strong>Scaling & Unit System Debug</strong></div>
      <div>Scale Factor: ${info.scaleFactor.toFixed(3)}</div>
      <div>Viewport: ${info.viewport.width}x${info.viewport.height}</div>
      <div>DPI: ${info.viewport.devicePixelRatio}</div>
      <div><strong>Unit System</strong></div>
      <div>Base Font: ${unitInfo.config.baseFontSize}px</div>
      <div>1rem = ${unitSystem.rem(1).toFixed(3)} Three.js units</div>
      <div>14px = ${unitSystem.px(14).toFixed(3)} Three.js units</div>
      <div>1.5rem = ${unitSystem.rem(1.5).toFixed(3)} (24px font)</div>
    `;
  };

  updateDebugInfo();
  window.addEventListener('resize', updateDebugInfo);

  document.body.appendChild(debugContainer);
};

// Add debug info in development
if (process.env.NODE_ENV === 'development') {
  addScalingDebugInfo();
}

// Debug panel setup
const debugPanel = new DebugPanel({
  onExampleChange: async (exampleType: ExampleType) => {
    await app.switchExample(exampleType);
  },
  onAlignmentChange: async (alignment: string) => {
    await app.switchAlignment(alignment as 'center' | 'top');
  },
  onVerticalAlignmentChange: async (verticalAlignment: string) => {
    await app.switchVerticalAlignment(verticalAlignment as 'center' | 'left');
  },
  onProjectionChange: (projection: string) => {
    app.switchProjection(projection);
  },
  onWireframeChange: async (wireframe: boolean) => {
    await app.switchWireframe(wireframe);
  },
  onHeightModeChange: async (heightMode: 'fixed' | 'dynamic') => {
    await app.switchHeightMode(heightMode);
  },
  onThemeChange: (theme: 'dark' | 'light') => {
    document.documentElement.className = theme === 'light' ? 'theme-light' : '';
  },
  onAxisHelperChange: (show: boolean) => {
    app.switchAxisHelper(show);
  },
});
debugPanel.initialize();

// Initialize application with all saved settings
const savedExample = debugPanel.getSavedExample();
const savedAlignment = debugPanel.getSavedAlignment();
const savedVerticalAlignment = debugPanel.getSavedVerticalAlignment();
const savedProjection = debugPanel.getSavedProjection();
const savedWireframe = debugPanel.getSavedWireframe();
const savedHeightMode = debugPanel.getSavedHeightMode();
const savedTheme = debugPanel.getSavedTheme();
const savedAxisHelper = debugPanel.getSavedAxisHelper();

// Initialize application with all saved settings
try {
  await app.initialize({
    example: isValidExampleType(savedExample) ? savedExample : undefined,
    alignment: savedAlignment === 'center' || savedAlignment === 'top' ? savedAlignment : undefined,
    verticalAlignment: savedVerticalAlignment === 'center' || savedVerticalAlignment === 'left' ? savedVerticalAlignment : undefined,
    projection: savedProjection || undefined,
    wireframe: savedWireframe,
    heightMode: savedHeightMode,
  });

  // Apply saved theme
  document.documentElement.className = savedTheme === 'light' ? 'theme-light' : '';

  // Always apply saved axis helper to ensure consistency
  app.switchAxisHelper(savedAxisHelper);
} catch (err) {
  console.error('Failed to initialize application:', err);
}
