import type { Edge, Graph, Node } from '../graph/graph.ts';

export interface RenderStyle {
  nodeRadius: number;
  nodeColor: string;
  nodeStroke: string;
  nodeStrokeWidth: number;
  edgeColor: string;
  edgeWidth: number;
  textColor: string;
  fontSize: number;
}

export class SvgRenderer {
  private svg: SVGElement;
  private style: RenderStyle;

  constructor(svgElement: SVGElement, style?: Partial<RenderStyle>) {
    this.svg = svgElement;
    this.style = {
      nodeRadius: 20,
      nodeColor: '#3b82f6',
      nodeStroke: '#1e40af',
      nodeStrokeWidth: 2,
      edgeColor: '#6b7280',
      edgeWidth: 2,
      textColor: '#ffffff',
      fontSize: 12,
      ...style,
    };
  }

  render(graph: Graph): void {
    this.clear();

    if (graph.nodes.size === 0) {
      this.renderEmptyState();
      return;
    }

    // Create groups for edges and nodes
    const edgesGroup = this.createSVGElement('g', { class: 'edges' });
    const nodesGroup = this.createSVGElement('g', { class: 'nodes' });

    this.svg.appendChild(edgesGroup);
    this.svg.appendChild(nodesGroup);

    // Render edges first (so they appear behind nodes)
    graph.edges.forEach((edge) => {
      this.renderEdge(edge, graph, edgesGroup);
    });

    // Render nodes
    graph.nodes.forEach((node) => {
      this.renderNode(node, nodesGroup);
    });
  }

  private renderNode(node: Node, parent: SVGElement): void {
    const nodeGroup = this.createSVGElement('g', {
      class: 'node',
      transform: `translate(${node.x}, ${node.y})`,
    });

    // Create circle
    const circle = this.createSVGElement('circle', {
      r: this.style.nodeRadius.toString(),
      fill: this.style.nodeColor,
      stroke: this.style.nodeStroke,
      'stroke-width': this.style.nodeStrokeWidth.toString(),
      class: 'node-circle',
    });

    // Create text label
    const text = this.createSVGElement('text', {
      'text-anchor': 'middle',
      'dominant-baseline': 'central',
      fill: this.style.textColor,
      'font-size': this.style.fontSize.toString(),
      'font-family': 'Arial, sans-serif',
      class: 'node-label',
    });
    text.textContent = node.id;

    nodeGroup.appendChild(circle);
    nodeGroup.appendChild(text);
    parent.appendChild(nodeGroup);
  }

  private renderEdge(edge: Edge, graph: Graph, parent: SVGElement): void {
    const fromNode = graph.nodes.get(edge.from);
    const toNode = graph.nodes.get(edge.to);

    if (!fromNode || !toNode) {
      return;
    }

    // Calculate edge positions (from edge of circle to edge of circle)
    const dx = toNode.x - fromNode.x;
    const dy = toNode.y - fromNode.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance === 0) return;

    const unitX = dx / distance;
    const unitY = dy / distance;

    const startX = fromNode.x + unitX * this.style.nodeRadius;
    const startY = fromNode.y + unitY * this.style.nodeRadius;
    const endX = toNode.x - unitX * this.style.nodeRadius;
    const endY = toNode.y - unitY * this.style.nodeRadius;

    // Create line
    const line = this.createSVGElement('line', {
      x1: startX.toString(),
      y1: startY.toString(),
      x2: endX.toString(),
      y2: endY.toString(),
      stroke: this.style.edgeColor,
      'stroke-width': this.style.edgeWidth.toString(),
      'marker-end': 'url(#arrowhead)',
      class: 'edge-line',
    });

    parent.appendChild(line);
  }

  private renderEmptyState(): void {
    const text = this.createSVGElement('text', {
      x: '50%',
      y: '50%',
      'text-anchor': 'middle',
      'dominant-baseline': 'central',
      fill: '#9ca3af',
      'font-size': '16',
      'font-family': 'Arial, sans-serif',
    });
    text.textContent = 'Add dependencies to see the graph';

    this.svg.appendChild(text);
  }

  private createSVGElement(tagName: string, attributes: Record<string, string>): SVGElement {
    const element = document.createElementNS('http://www.w3.org/2000/svg', tagName);

    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });

    return element;
  }

  clear(): void {
    this.svg.innerHTML = '';
    this.setupArrowMarker();
  }

  private setupArrowMarker(): void {
    // Create defs element if it doesn't exist
    let defs = this.svg.querySelector('defs') as SVGDefsElement;
    if (!defs) {
      defs = this.createSVGElement('defs', {}) as SVGDefsElement;
      this.svg.appendChild(defs);
    }

    // Create arrowhead marker
    const marker = this.createSVGElement('marker', {
      id: 'arrowhead',
      markerWidth: '10',
      markerHeight: '7',
      refX: '9',
      refY: '3.5',
      orient: 'auto',
    });

    const polygon = this.createSVGElement('polygon', {
      points: '0 0, 10 3.5, 0 7',
      fill: this.style.edgeColor,
    });

    marker.appendChild(polygon);
    defs.appendChild(marker);
  }

  updateStyle(newStyle: Partial<RenderStyle>): void {
    this.style = { ...this.style, ...newStyle };
  }
}
