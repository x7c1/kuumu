import type { Graph } from '../graph/graph.ts';

export interface LayoutAlgorithm {
  name: string;
  layout(graph: Graph): void;
}
