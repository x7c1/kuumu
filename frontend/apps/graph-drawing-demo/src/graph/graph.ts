export interface Node {
  id: string;
  x: number;
  y: number;
  dependencies: string[];
}

export interface Edge {
  id: number;
  from: string;
  to: string;
  label: string;
}

export interface Graph {
  nodes: Map<string, Node>;
  edges: Edge[];
}

export function createGraph(): Graph {
  return {
    nodes: new Map(),
    edges: [],
  };
}

export function createNode(id: string, x = 0, y = 0): Node {
  return {
    id,
    x,
    y,
    dependencies: [],
  };
}

export function createEdge(id: number, from: string, to: string): Edge {
  return {
    id,
    from,
    to,
    label: `${from}->${to}`,
  };
}

export class GraphBuilder {
  private graph: Graph;

  constructor() {
    this.graph = createGraph();
  }

  addNode(id: string, x = 0, y = 0): Node {
    if (!this.graph.nodes.has(id)) {
      const node = createNode(id, x, y);
      this.graph.nodes.set(id, node);
      return node;
    }
    return this.graph.nodes.get(id)!;
  }

  addEdge(id: number, from: string, to: string): Edge {
    // Ensure both nodes exist
    this.addNode(from);
    this.addNode(to);

    // Add dependency relationship
    const fromNode = this.graph.nodes.get(from)!;
    if (!fromNode.dependencies.includes(to)) {
      fromNode.dependencies.push(to);
    }

    // Create edge
    const edge = createEdge(id, from, to);
    this.graph.edges.push(edge);

    return edge;
  }

  removeEdge(id: number): boolean {
    const edgeIndex = this.graph.edges.findIndex((edge) => edge.id === id);
    if (edgeIndex === -1) {
      return false;
    }

    const edge = this.graph.edges[edgeIndex];

    // Remove dependency relationship
    const fromNode = this.graph.nodes.get(edge.from);
    if (fromNode) {
      const depIndex = fromNode.dependencies.indexOf(edge.to);
      if (depIndex !== -1) {
        fromNode.dependencies.splice(depIndex, 1);
      }
    }

    // Remove edge
    this.graph.edges.splice(edgeIndex, 1);

    // Remove orphaned nodes (nodes with no edges)
    this.removeOrphanedNodes();

    return true;
  }

  clear(): void {
    this.graph.nodes.clear();
    this.graph.edges = [];
  }

  getGraph(): Graph {
    return this.graph;
  }

  private removeOrphanedNodes(): void {
    const connectedNodes = new Set<string>();

    this.graph.edges.forEach((edge) => {
      connectedNodes.add(edge.from);
      connectedNodes.add(edge.to);
    });

    const allNodes = Array.from(this.graph.nodes.keys());
    allNodes.forEach((nodeId) => {
      if (!connectedNodes.has(nodeId)) {
        this.graph.nodes.delete(nodeId);
      }
    });
  }
}
