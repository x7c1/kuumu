import { DependencyTracker } from './graph/dependency-tracker.ts';
import { GraphBuilder } from './graph/graph.ts';
import * as GraphSerializer from './graph/graph-serializer.ts';
import { parseDependency, validateDependencyInput } from './graph/parser.ts';
import type { LayoutAlgorithm } from './layout/algorithm-interface.ts';
import {
  CircleLayout,
  ForceDirectedLayout,
  GridLayout,
  HierarchicalLayout,
  KuumuLayout,
  RandomLayout,
} from './layout/index.ts';
import { PerformanceMonitor } from './layout/performance-monitor.ts';
import { SvgRenderer, type ViewTransform } from './renderer/svg-renderer.ts';
import { type AlgorithmParameters, UIControls } from './ui/controls.ts';

class GraphDrawingApp {
  private dependencyTracker: DependencyTracker;
  private graphBuilder: GraphBuilder;
  private renderer: SvgRenderer;
  private uiControls: UIControls;
  private algorithms: Map<string, LayoutAlgorithm>;
  private currentAlgorithm: LayoutAlgorithm;
  private performanceMonitor: PerformanceMonitor;

  constructor() {
    this.dependencyTracker = new DependencyTracker();
    this.graphBuilder = new GraphBuilder();

    // Get SVG element and initialize renderer
    const svgElement = document.getElementById('graph-svg');
    if (!svgElement || !(svgElement instanceof SVGElement)) {
      throw new Error('SVG element not found');
    }
    this.renderer = new SvgRenderer(svgElement);

    // Initialize UI controls
    this.uiControls = new UIControls();

    // Initialize algorithms
    this.algorithms = new Map<string, LayoutAlgorithm>([
      ['grid', new GridLayout()],
      ['circle', new CircleLayout()],
      ['random', new RandomLayout()],
      ['force', new ForceDirectedLayout()],
      ['hierarchical', new HierarchicalLayout()],
      ['kuumu', new KuumuLayout()],
    ]);
    this.currentAlgorithm = this.algorithms.get('grid')!;
    this.performanceMonitor = new PerformanceMonitor();

    this.setupEventHandlers();
    this.updateParameterControls();
    this.setupViewControls();

    // Update graph and UI with any loaded dependencies
    this.updateGraph();
    this.updateUI();
    this.render();
  }

  private setupEventHandlers(): void {
    // Handle dependency addition
    this.uiControls.onDependencyAdd((input) => {
      this.handleDependencyAdd(input);
    });

    // Handle dependency removal
    this.uiControls.onDependencyRemove((id) => {
      this.handleDependencyRemove(id);
    });

    // Handle algorithm change
    this.uiControls.onAlgorithmChange((algorithmKey) => {
      this.handleAlgorithmChange(algorithmKey);
    });

    // Handle parameter changes
    this.uiControls.onParameterChange((parameters) => {
      this.handleParameterChange(parameters);
    });

    // Handle apply layout button
    this.uiControls.onApplyLayout(() => {
      this.render();
    });

    // Handle clear graph button
    this.uiControls.onClearGraph(() => {
      this.clearGraph();
    });

    // Handle show comparison button
    this.uiControls.onShowComparison(() => {
      this.showComparison();
    });

    // Handle close comparison modal
    this.uiControls.onCloseComparison(() => {
      this.hideComparison();
    });

    // Handle dependency tracker changes
    this.dependencyTracker.onChange(() => {
      this.updateGraph();
      this.updateUI();
      this.render();
    });

    // Handle graph save/load
    this.uiControls.onSaveGraph(() => {
      this.handleSaveGraph();
    });

    this.uiControls.onLoadGraph(() => {
      this.handleLoadGraph();
    });
  }

  private handleDependencyAdd(input: string): void {
    this.uiControls.clearError();

    // Validate input
    const validationError = validateDependencyInput(input);
    if (validationError) {
      this.uiControls.showError(validationError.message);
      return;
    }

    // Parse dependency
    const parsed = parseDependency(input);
    if (!parsed) {
      this.uiControls.showError('Invalid dependency format');
      return;
    }

    // Add to tracker
    const result = this.dependencyTracker.addDependency(parsed.from, parsed.to);
    if (!result) {
      this.uiControls.showError('Dependency already exists');
      return;
    }
  }

  private handleDependencyRemove(id: number): void {
    this.dependencyTracker.removeDependency(id);
  }

  private handleAlgorithmChange(algorithmKey: string): void {
    this.currentAlgorithm = this.createAlgorithmWithDefaults(algorithmKey);
    this.updateParameterControls();
    this.render();
  }

  private handleParameterChange(parameters: AlgorithmParameters): void {
    const algorithmKey = this.uiControls.getCurrentAlgorithm();
    this.currentAlgorithm = this.createAlgorithmWithParameters(algorithmKey, parameters);
    // Don't auto-render on parameter change - user needs to click Apply Layout
  }

  private createAlgorithmWithDefaults(algorithmKey: string): LayoutAlgorithm {
    switch (algorithmKey) {
      case 'grid':
        return new GridLayout();
      case 'circle':
        return new CircleLayout();
      case 'random':
        return new RandomLayout();
      case 'force':
        return new ForceDirectedLayout();
      case 'hierarchical':
        return new HierarchicalLayout();
      case 'kuumu':
        return new KuumuLayout();
      default:
        return new GridLayout();
    }
  }

  private createAlgorithmWithParameters(
    algorithmKey: string,
    parameters: AlgorithmParameters
  ): LayoutAlgorithm {
    switch (algorithmKey) {
      case 'grid':
        return new GridLayout(parameters.spacing || 100, parameters.columns || 3);
      case 'circle':
        return new CircleLayout(
          300,
          200, // centerX, centerY (fixed for now)
          parameters.radius || 150
        );
      case 'random':
        return new RandomLayout();
      case 'force':
        return new ForceDirectedLayout(
          parameters.springLength || 100,
          parameters.springStrength || 0.1,
          parameters.repulsionForce || 1000,
          parameters.damping || 0.9,
          parameters.iterations || 50
        );
      case 'hierarchical':
        return new HierarchicalLayout(parameters.levelHeight || 100, parameters.nodeSpacing || 80);
      case 'kuumu':
        return new KuumuLayout();
      default:
        return new GridLayout();
    }
  }

  private updateParameterControls(): void {
    const algorithmKey = this.uiControls.getCurrentAlgorithm();
    this.uiControls.updateParameterControls(algorithmKey);
  }

  private clearGraph(): void {
    this.dependencyTracker.clear();
    this.performanceMonitor.clear();
    this.uiControls.clearPerformanceDisplay();
    this.uiControls.clearError();
  }

  private showComparison(): void {
    const metricsByAlgorithm = this.performanceMonitor.getMetricsByAlgorithm();

    // Convert to the format expected by UI
    const comparisonData = new Map<
      string,
      Array<{ executionTime: number; nodeCount: number; edgeCount: number }>
    >();

    metricsByAlgorithm.forEach((metrics, algorithmName) => {
      const data = metrics.map((m) => ({
        executionTime: m.executionTime,
        nodeCount: m.nodeCount,
        edgeCount: m.edgeCount,
      }));
      comparisonData.set(algorithmName, data);
    });

    this.uiControls.showComparisonModal(comparisonData);
  }

  private hideComparison(): void {
    this.uiControls.hideComparisonModal();
  }

  private handleSaveGraph(): void {
    const dependencies = this.dependencyTracker.getDependencies();

    if (dependencies.length === 0) {
      this.uiControls.showError('No dependencies to save');
      return;
    }

    try {
      const filename = GraphSerializer.generateFilename('dependency-graph');
      GraphSerializer.exportToFile(dependencies, filename);
    } catch (error) {
      console.error('Failed to save graph:', error);
      this.uiControls.showError('Failed to save graph file');
    }
  }

  private async handleLoadGraph(): Promise<void> {
    try {
      const { dependencies } = await GraphSerializer.importFromFile();

      // Validate the data before loading
      const validationErrors = GraphSerializer.validateGraphData(dependencies);
      if (validationErrors.length > 0) {
        this.uiControls.showError(`Invalid graph data: ${validationErrors[0]}`);
        return;
      }

      // Clear current graph and load new dependencies
      this.dependencyTracker.clear();

      // Add each dependency individually to trigger proper validation
      let loadedCount = 0;
      for (const dep of dependencies) {
        const result = this.dependencyTracker.addDependency(dep.from, dep.to);
        if (result) {
          loadedCount++;
        }
      }

      if (loadedCount === 0) {
        this.uiControls.showError('No valid dependencies found in file');
      } else {
        console.log(`Loaded ${loadedCount} dependencies from file`);
      }
    } catch (error) {
      console.error('Failed to load graph:', error);
      if (error instanceof Error) {
        this.uiControls.showError(`Failed to load graph: ${error.message}`);
      } else {
        this.uiControls.showError('Failed to load graph file');
      }
    }
  }

  private setupViewControls(): void {
    // Handle view transform changes
    this.renderer.onViewTransformChanged((transform: ViewTransform) => {
      this.uiControls.updateZoomLevel(transform.scale);
    });

    // Handle reset view button
    this.uiControls.onResetView(() => {
      this.renderer.resetView();
    });

    // Handle fit content button
    this.uiControls.onFitContent(() => {
      this.renderer.fitToContent();
    });

    // Initialize zoom level display
    const initialTransform = this.renderer.getViewTransform();
    this.uiControls.updateZoomLevel(initialTransform.scale);
  }

  private updateGraph(): void {
    // Clear existing graph
    this.graphBuilder.clear();

    // Add dependencies to graph
    const dependencies = this.dependencyTracker.getDependencies();
    dependencies.forEach((dep) => {
      this.graphBuilder.addEdge(dep.id, dep.from, dep.to);
    });
  }

  private updateUI(): void {
    const dependencies = this.dependencyTracker.getDependencies();
    const listItems = dependencies.map((dep) => ({
      id: dep.id,
      label: dep.label,
    }));

    this.uiControls.updateDependencyList(listItems);
  }

  private render(): void {
    const graph = this.graphBuilder.getGraph();

    // Apply layout algorithm with performance monitoring
    const { metrics } = this.performanceMonitor.measureAlgorithm(
      this.currentAlgorithm.name,
      graph.nodes.size,
      graph.edges.length,
      () => this.currentAlgorithm.layout(graph)
    );

    // Render graph
    this.renderer.render(graph);

    // Update performance display
    const averageTime = this.performanceMonitor.getAverageExecutionTime(this.currentAlgorithm.name);
    this.uiControls.updatePerformanceDisplay(metrics, averageTime);
  }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  try {
    new GraphDrawingApp();
    console.log('Graph Drawing Demo initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Graph Drawing Demo:', error);
  }
});
