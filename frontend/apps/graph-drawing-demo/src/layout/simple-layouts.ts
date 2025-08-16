import type { Graph } from '../graph/graph.ts';
import type { LayoutAlgorithm } from './algorithm-interface.ts';

export class GridLayout implements LayoutAlgorithm {
  name = 'Grid Layout';

  constructor(
    private spacing = 100,
    private columns = 3
  ) {}

  layout(graph: Graph): void {
    const nodes = Array.from(graph.nodes.values());

    nodes.forEach((node, index) => {
      const row = Math.floor(index / this.columns);
      const col = index % this.columns;

      node.x = 50 + col * this.spacing;
      node.y = 50 + row * this.spacing;
    });
  }
}

export class CircleLayout implements LayoutAlgorithm {
  name = 'Circle Layout';

  constructor(
    private centerX = 300,
    private centerY = 200,
    private radius = 150
  ) {}

  layout(graph: Graph): void {
    const nodes = Array.from(graph.nodes.values());
    const nodeCount = nodes.length;

    if (nodeCount === 0) return;

    if (nodeCount === 1) {
      nodes[0].x = this.centerX;
      nodes[0].y = this.centerY;
      return;
    }

    nodes.forEach((node, index) => {
      const angle = (2 * Math.PI * index) / nodeCount;
      node.x = this.centerX + this.radius * Math.cos(angle);
      node.y = this.centerY + this.radius * Math.sin(angle);
    });
  }
}

export class RandomLayout implements LayoutAlgorithm {
  name = 'Random Layout';

  constructor(
    private width = 600,
    private height = 400,
    private margin = 50
  ) {}

  layout(graph: Graph): void {
    const nodes = Array.from(graph.nodes.values());

    nodes.forEach((node) => {
      node.x = this.margin + Math.random() * (this.width - 2 * this.margin);
      node.y = this.margin + Math.random() * (this.height - 2 * this.margin);
    });
  }
}
