import type { Graph } from '../graph/graph.ts';
import type { LayoutAlgorithm } from './algorithm-interface.ts';

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
