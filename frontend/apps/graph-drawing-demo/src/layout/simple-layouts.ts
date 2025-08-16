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

export class HierarchicalLayout implements LayoutAlgorithm {
  name = 'Hierarchical Layout';

  constructor(
    private levelHeight = 100,
    private nodeSpacing = 80,
    private width = 600,
    private margin = 50
  ) {}

  layout(graph: Graph): void {
    const nodes = Array.from(graph.nodes.values());
    const edges = graph.edges;

    if (nodes.length === 0) return;

    // Build dependency graph to determine levels
    const levels = this.calculateLevels(nodes, edges);

    // Position nodes by level
    this.positionNodesByLevel(levels, graph);
  }

  private calculateLevels(
    nodes: Array<{ id: string; x: number; y: number; dependencies: string[] }>,
    edges: Array<{ from: string; to: string }>
  ): Map<number, string[]> {
    const inDegree = new Map<string, number>();
    const adjacencyList = new Map<string, string[]>();

    // Initialize
    nodes.forEach((node) => {
      inDegree.set(node.id, 0);
      adjacencyList.set(node.id, []);
    });

    // Build adjacency list and calculate in-degrees
    edges.forEach((edge) => {
      const fromDeps = adjacencyList.get(edge.from) || [];
      fromDeps.push(edge.to);
      adjacencyList.set(edge.from, fromDeps);

      const toDegree = inDegree.get(edge.to) || 0;
      inDegree.set(edge.to, toDegree + 1);
    });

    // Topological sort to determine levels
    const levels = new Map<number, string[]>();
    const queue: string[] = [];
    const nodeLevel = new Map<string, number>();

    // Start with nodes that have no dependencies
    nodes.forEach((node) => {
      if ((inDegree.get(node.id) || 0) === 0) {
        queue.push(node.id);
        nodeLevel.set(node.id, 0);
      }
    });

    let currentLevel = 0;
    while (queue.length > 0) {
      const levelSize = queue.length;
      const currentLevelNodes: string[] = [];

      for (let i = 0; i < levelSize; i++) {
        const nodeId = queue.shift()!;
        currentLevelNodes.push(nodeId);

        // Process dependencies
        const deps = adjacencyList.get(nodeId) || [];
        deps.forEach((depId) => {
          const degree = (inDegree.get(depId) || 0) - 1;
          inDegree.set(depId, degree);

          if (degree === 0) {
            queue.push(depId);
            nodeLevel.set(depId, currentLevel + 1);
          }
        });
      }

      if (currentLevelNodes.length > 0) {
        levels.set(currentLevel, currentLevelNodes);
        currentLevel++;
      }
    }

    // Handle any remaining nodes (cycles)
    nodes.forEach((node) => {
      if (!nodeLevel.has(node.id)) {
        const level = currentLevel;
        const levelNodes = levels.get(level) || [];
        levelNodes.push(node.id);
        levels.set(level, levelNodes);
        nodeLevel.set(node.id, level);
      }
    });

    return levels;
  }

  private positionNodesByLevel(levels: Map<number, string[]>, graph: Graph): void {
    levels.forEach((nodeIds, level) => {
      const y = this.margin + level * this.levelHeight;
      const totalWidth = Math.max(0, (nodeIds.length - 1) * this.nodeSpacing);
      const startX = (this.width - totalWidth) / 2;

      nodeIds.forEach((nodeId, index) => {
        const node = graph.nodes.get(nodeId);
        if (node) {
          node.x = startX + index * this.nodeSpacing;
          node.y = y;
        }
      });
    });
  }
}
