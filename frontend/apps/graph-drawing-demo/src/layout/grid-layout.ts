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
