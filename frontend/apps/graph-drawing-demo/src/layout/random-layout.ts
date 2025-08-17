import type { Graph } from '../graph/graph.ts';
import type { LayoutAlgorithm } from './algorithm-interface.ts';

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
