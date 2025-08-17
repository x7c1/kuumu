import type { Graph } from '../graph/graph.ts';
import type { LayoutAlgorithm } from './algorithm-interface.ts';

export class ForceDirectedLayout implements LayoutAlgorithm {
  name = 'Force-Directed Layout';

  constructor(
    private springLength = 100,
    private springStrength = 0.1,
    private repulsionForce = 1000,
    private damping = 0.9,
    private iterations = 50,
    private width = 600,
    private height = 400,
    private margin = 50
  ) {}

  layout(graph: Graph): void {
    const nodes = Array.from(graph.nodes.values());
    const edges = graph.edges;

    if (nodes.length === 0) return;

    // Initialize positions if not set or if nodes are overlapping
    this.initializePositions(nodes);

    // Run force-directed simulation
    for (let iter = 0; iter < this.iterations; iter++) {
      const forces = new Map<string, { x: number; y: number }>();

      // Initialize forces
      nodes.forEach((node) => {
        forces.set(node.id, { x: 0, y: 0 });
      });

      // Calculate repulsion forces between all node pairs
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const nodeA = nodes[i];
          const nodeB = nodes[j];

          const dx = nodeB.x - nodeA.x;
          const dy = nodeB.y - nodeA.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance > 0) {
            const force = this.repulsionForce / (distance * distance);
            const fx = (dx / distance) * force;
            const fy = (dy / distance) * force;

            const forceA = forces.get(nodeA.id)!;
            const forceB = forces.get(nodeB.id)!;

            forceA.x -= fx;
            forceA.y -= fy;
            forceB.x += fx;
            forceB.y += fy;
          }
        }
      }

      // Calculate attraction forces for connected nodes
      edges.forEach((edge) => {
        const nodeA = graph.nodes.get(edge.from);
        const nodeB = graph.nodes.get(edge.to);

        if (!nodeA || !nodeB) return;

        const dx = nodeB.x - nodeA.x;
        const dy = nodeB.y - nodeA.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
          const displacement = distance - this.springLength;
          const force = displacement * this.springStrength;
          const fx = (dx / distance) * force;
          const fy = (dy / distance) * force;

          const forceA = forces.get(nodeA.id)!;
          const forceB = forces.get(nodeB.id)!;

          forceA.x += fx;
          forceA.y += fy;
          forceB.x -= fx;
          forceB.y -= fy;
        }
      });

      // Apply forces and update positions
      nodes.forEach((node) => {
        const force = forces.get(node.id)!;

        // Apply damping
        force.x *= this.damping;
        force.y *= this.damping;

        // Update position
        node.x += force.x;
        node.y += force.y;

        // Keep nodes within bounds
        node.x = Math.max(this.margin, Math.min(this.width - this.margin, node.x));
        node.y = Math.max(this.margin, Math.min(this.height - this.margin, node.y));
      });
    }
  }

  private initializePositions(nodes: Array<{ id: string; x: number; y: number }>): void {
    // Check if nodes need initialization (all at origin or overlapping)
    const needsInit =
      nodes.every((node) => node.x === 0 && node.y === 0) || this.hasOverlappingNodes(nodes);

    if (needsInit) {
      // Place nodes in a grid pattern as starting positions
      const cols = Math.ceil(Math.sqrt(nodes.length));
      const spacing = Math.min(
        (this.width - 2 * this.margin) / cols,
        (this.height - 2 * this.margin) / Math.ceil(nodes.length / cols)
      );

      nodes.forEach((node, index) => {
        const row = Math.floor(index / cols);
        const col = index % cols;
        node.x = this.margin + col * spacing + spacing / 2;
        node.y = this.margin + row * spacing + spacing / 2;
      });
    }
  }

  private hasOverlappingNodes(nodes: Array<{ x: number; y: number }>): boolean {
    const threshold = 5; // pixels
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < threshold) {
          return true;
        }
      }
    }
    return false;
  }
}
