import { DependencyTracker } from './graph/dependency-tracker.ts';
import { GraphBuilder } from './graph/graph.ts';
import { parseDependency, validateDependencyInput } from './graph/parser.ts';
import type { LayoutAlgorithm } from './layout/algorithm-interface.ts';
import { CircleLayout, GridLayout, RandomLayout } from './layout/simple-layouts.ts';
import { SvgRenderer } from './renderer/svg-renderer.ts';
import { UIControls } from './ui/controls.ts';

class GraphDrawingApp {
  private dependencyTracker: DependencyTracker;
  private graphBuilder: GraphBuilder;
  private renderer: SvgRenderer;
  private uiControls: UIControls;
  private algorithms: Map<string, LayoutAlgorithm>;
  private currentAlgorithm: LayoutAlgorithm;

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
    ]);
    this.currentAlgorithm = this.algorithms.get('grid')!;

    this.setupEventHandlers();
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

    // Handle dependency tracker changes
    this.dependencyTracker.onChange(() => {
      this.updateGraph();
      this.updateUI();
      this.render();
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
    const algorithm = this.algorithms.get(algorithmKey);
    if (algorithm) {
      this.currentAlgorithm = algorithm;
      this.render();
    }
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

    // Apply layout algorithm
    this.currentAlgorithm.layout(graph);

    // Render graph
    this.renderer.render(graph);
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
