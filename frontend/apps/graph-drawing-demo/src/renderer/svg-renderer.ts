import type { Edge, Graph, Node } from '../graph/graph.ts';
import { SVGInteractionHandler, type ViewTransform } from './svg-interactions.ts';

export type { ViewTransform };

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
  private interactionHandler: SVGInteractionHandler;

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

    // Initialize interaction handler
    this.interactionHandler = new SVGInteractionHandler(this.svg);

    // Set cursor style for interactive SVG
    this.svg.style.cursor = 'grab';
  }

  render(graph: Graph): void {
    this.clear();

    if (graph.nodes.size === 0) {
      this.renderEmptyState();
      return;
    }

    // Get the viewport group from interaction handler
    const viewportGroup = this.interactionHandler.getViewportGroup();

    // Create groups for edges and nodes within the viewport
    const edgesGroup = this.createSVGElement('g', { class: 'edges' });
    const nodesGroup = this.createSVGElement('g', { class: 'nodes' });

    viewportGroup.appendChild(edgesGroup);
    viewportGroup.appendChild(nodesGroup);

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
    const viewportGroup = this.interactionHandler.getViewportGroup();

    const text = this.createSVGElement('text', {
      x: '0',
      y: '0',
      'text-anchor': 'middle',
      'dominant-baseline': 'central',
      fill: '#9ca3af',
      'font-size': '16',
      'font-family': 'Arial, sans-serif',
      transform: 'translate(400, 300)', // Center in typical viewport
    });
    text.textContent = 'Add dependencies to see the graph';

    viewportGroup.appendChild(text);
  }

  private createSVGElement(tagName: string, attributes: Record<string, string>): SVGElement {
    const element = document.createElementNS('http://www.w3.org/2000/svg', tagName);

    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });

    return element;
  }

  clear(): void {
    // Clear the viewport group
    const viewportGroup = this.interactionHandler.getViewportGroup();
    viewportGroup.innerHTML = '';

    // Clear any remaining elements from the SVG root that might have been added
    const svgChildren = Array.from(this.svg.children);
    for (const child of svgChildren) {
      if (child.tagName === 'text') {
        this.svg.removeChild(child);
      }
    }

    this.setupArrowMarker();
  }

  highlightDependency(fromNodeId: string, toNodeId: string): void {
    // Remove any existing highlights
    this.clearHighlight();

    // Find and highlight the specific dependency
    const nodes = this.svg.querySelectorAll('.node');
    const edges = this.svg.querySelectorAll('.edge-line');

    // Highlight nodes
    nodes.forEach((nodeGroup) => {
      const nodeElement = nodeGroup as SVGElement;
      const circle = nodeElement.querySelector('.node-circle') as SVGElement;
      const text = nodeElement.querySelector('.node-label') as SVGElement;

      if (text && (text.textContent === fromNodeId || text.textContent === toNodeId)) {
        circle?.classList.add('highlighted-node');
        text?.classList.add('highlighted-text');
      } else {
        circle?.classList.add('dimmed-node');
        text?.classList.add('dimmed-text');
      }
    });

    // Highlight edge
    edges.forEach((edge) => {
      const edgeElement = edge as SVGElement;
      if (this.isEdgeConnecting(edgeElement, fromNodeId, toNodeId)) {
        edgeElement.classList.add('highlighted-edge');
      } else {
        edgeElement.classList.add('dimmed-edge');
      }
    });
  }

  clearHighlight(): void {
    const allElements = this.svg.querySelectorAll(
      '.highlighted-node, .highlighted-edge, .highlighted-text, .dimmed-node, .dimmed-edge, .dimmed-text'
    );
    allElements.forEach((element) => {
      element.classList.remove(
        'highlighted-node',
        'highlighted-edge',
        'highlighted-text',
        'dimmed-node',
        'dimmed-edge',
        'dimmed-text'
      );
    });
  }

  highlightDependenciesForNode(nodeId: string): void {
    // Remove any existing highlights
    this.clearHighlight();

    // Find and highlight nodes and edges connected to the specified node
    const nodes = this.svg.querySelectorAll('.node');
    const edges = this.svg.querySelectorAll('.edge-line');

    // Highlight the target node and connected nodes/edges
    nodes.forEach((nodeGroup) => {
      const nodeElement = nodeGroup as SVGElement;
      const text = nodeElement.querySelector('.node-label') as SVGElement;
      const circle = nodeElement.querySelector('.node-circle') as SVGElement;

      if (text && text.textContent === nodeId) {
        // Highlight the target node
        circle?.classList.add('highlighted-node');
        text?.classList.add('highlighted-text');
      } else {
        // Check if this node is connected to the target node
        const isConnected = this.isNodeConnectedTo(text?.textContent || '', nodeId);
        if (isConnected) {
          circle?.classList.add('highlighted-node');
          text?.classList.add('highlighted-text');
        } else {
          circle?.classList.add('dimmed-node');
          text?.classList.add('dimmed-text');
        }
      }
    });

    // Highlight edges connected to the target node
    edges.forEach((edge) => {
      const edgeElement = edge as SVGElement;
      if (this.isEdgeConnectedToNode(edgeElement, nodeId)) {
        edgeElement.classList.add('highlighted-edge');
      } else {
        edgeElement.classList.add('dimmed-edge');
      }
    });
  }

  private isNodeConnectedTo(nodeId: string, targetNodeId: string): boolean {
    // Check if there's an edge between nodeId and targetNodeId
    const edges = this.svg.querySelectorAll('.edge-line');

    for (const edge of edges) {
      const edgeElement = edge as SVGElement;
      if (
        this.isEdgeConnecting(edgeElement, nodeId, targetNodeId) ||
        this.isEdgeConnecting(edgeElement, targetNodeId, nodeId)
      ) {
        return true;
      }
    }
    return false;
  }

  private isEdgeConnectedToNode(edgeElement: SVGElement, nodeId: string): boolean {
    // Get all nodes and check if the edge connects to the specified node
    const nodes = this.svg.querySelectorAll('.node');

    for (const nodeGroup of nodes) {
      const nodeElement = nodeGroup as SVGElement;
      const text = nodeElement.querySelector('.node-label') as SVGElement;

      if (text?.textContent !== nodeId) {
        const otherNodeId = text?.textContent || '';
        if (
          this.isEdgeConnecting(edgeElement, nodeId, otherNodeId) ||
          this.isEdgeConnecting(edgeElement, otherNodeId, nodeId)
        ) {
          return true;
        }
      }
    }
    return false;
  }

  private isEdgeConnecting(edgeElement: SVGElement, fromNodeId: string, toNodeId: string): boolean {
    // Get the edge coordinates
    const x1 = parseFloat(edgeElement.getAttribute('x1') || '0');
    const y1 = parseFloat(edgeElement.getAttribute('y1') || '0');
    const x2 = parseFloat(edgeElement.getAttribute('x2') || '0');
    const y2 = parseFloat(edgeElement.getAttribute('y2') || '0');

    // Find nodes by their labels and check if their positions match the edge coordinates
    const nodes = this.svg.querySelectorAll('.node');
    let fromNode: SVGElement | null = null;
    let toNode: SVGElement | null = null;

    nodes.forEach((nodeGroup) => {
      const nodeElement = nodeGroup as SVGElement;
      const text = nodeElement.querySelector('.node-label') as SVGElement;
      if (text?.textContent === fromNodeId) {
        fromNode = nodeElement;
      } else if (text?.textContent === toNodeId) {
        toNode = nodeElement;
      }
    });

    if (!fromNode || !toNode) return false;

    // Extract node positions from transform attributes
    const fromTransform = (fromNode as SVGElement).getAttribute('transform') || '';
    const toTransform = (toNode as SVGElement).getAttribute('transform') || '';

    const fromMatch = fromTransform.match(/translate\(([^,]+),\s*([^)]+)\)/);
    const toMatch = toTransform.match(/translate\(([^,]+),\s*([^)]+)\)/);

    if (!fromMatch || !toMatch) return false;

    const fromX = parseFloat(fromMatch[1]);
    const fromY = parseFloat(fromMatch[2]);
    const toX = parseFloat(toMatch[1]);
    const toY = parseFloat(toMatch[2]);

    // Calculate expected edge positions considering node radius
    const dx = toX - fromX;
    const dy = toY - fromY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance === 0) return false;

    const unitX = dx / distance;
    const unitY = dy / distance;

    const expectedStartX = fromX + unitX * this.style.nodeRadius;
    const expectedStartY = fromY + unitY * this.style.nodeRadius;
    const expectedEndX = toX - unitX * this.style.nodeRadius;
    const expectedEndY = toY - unitY * this.style.nodeRadius;

    // Check if edge coordinates match (with some tolerance for floating point errors)
    const tolerance = 1;
    return (
      Math.abs(x1 - expectedStartX) < tolerance &&
      Math.abs(y1 - expectedStartY) < tolerance &&
      Math.abs(x2 - expectedEndX) < tolerance &&
      Math.abs(y2 - expectedEndY) < tolerance
    );
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

  // Interaction API
  resetView(): void {
    this.interactionHandler.resetView();
  }

  fitToContent(): void {
    this.interactionHandler.fitToContent();
  }

  getViewTransform(): ViewTransform {
    return this.interactionHandler.getTransform();
  }

  onViewTransformChanged(callback: (transform: ViewTransform) => void): void {
    this.interactionHandler.onTransformChanged(callback);
  }

  destroy(): void {
    this.interactionHandler.destroy();
  }

  // Node hover handlers
  onNodeHover(onMouseEnter: (nodeId: string) => void, onMouseLeave: () => void): void {
    this.svg.addEventListener(
      'mouseenter',
      (e) => {
        const target = e.target as HTMLElement;
        const nodeGroup = target.closest('.node') as SVGElement;

        if (nodeGroup) {
          const nodeLabel = nodeGroup.querySelector('.node-label') as SVGElement;
          if (nodeLabel?.textContent) {
            onMouseEnter(nodeLabel.textContent);
          }
        }
      },
      true
    );

    this.svg.addEventListener(
      'mouseleave',
      (e) => {
        const target = e.target as HTMLElement;
        const nodeGroup = target.closest('.node') as SVGElement;

        if (nodeGroup) {
          onMouseLeave();
        }
      },
      true
    );
  }
}
