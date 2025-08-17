import type { Graph } from '../graph/graph.ts';
import type { LayoutAlgorithm } from './algorithm-interface.ts';

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
