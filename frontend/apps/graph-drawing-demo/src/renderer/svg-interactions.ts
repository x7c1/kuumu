export interface ViewTransform {
  x: number;
  y: number;
  scale: number;
}

export class SVGInteractionHandler {
  private svg: SVGElement;
  private viewportGroup: SVGGElement;
  private transform: ViewTransform;
  private isDragging = false;
  private lastPointerPosition = { x: 0, y: 0 };

  private onTransformChange?: (transform: ViewTransform) => void;

  constructor(svg: SVGElement) {
    this.svg = svg;
    this.transform = { x: 0, y: 0, scale: 1 };

    // Create viewport group for transformations
    this.viewportGroup = this.createSVGElement('g', { class: 'viewport' }) as SVGGElement;
    this.svg.appendChild(this.viewportGroup);

    this.setupEventListeners();
    this.updateTransform();
  }

  private createSVGElement(tagName: string, attributes: Record<string, string>): SVGElement {
    const element = document.createElementNS('http://www.w3.org/2000/svg', tagName);
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
    return element;
  }

  private setupEventListeners(): void {
    // Zoom with mouse wheel
    this.svg.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.handleZoom(e);
    });

    // Pan with mouse drag
    this.svg.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        // Left mouse button
        this.handlePanStart(e);
      }
    });

    this.svg.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        this.handlePanMove(e);
      }
    });

    this.svg.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        this.handlePanEnd();
      }
    });

    this.svg.addEventListener('mouseleave', () => {
      this.handlePanEnd();
    });

    // Touch support for mobile
    this.svg.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (e.touches.length === 1) {
        this.handlePanStart(e.touches[0]);
      }
    });

    this.svg.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (e.touches.length === 1 && this.isDragging) {
        this.handlePanMove(e.touches[0]);
      }
    });

    this.svg.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.handlePanEnd();
    });
  }

  private handleZoom(e: WheelEvent): void {
    const rect = this.svg.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Convert mouse position to SVG coordinates
    const svgPoint = this.screenToSVG(mouseX, mouseY);

    // Calculate zoom factor
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.1, Math.min(5, this.transform.scale * zoomFactor));

    // Calculate new pan to keep mouse position fixed
    const scaleDiff = newScale - this.transform.scale;
    const newX = this.transform.x - svgPoint.x * scaleDiff;
    const newY = this.transform.y - svgPoint.y * scaleDiff;

    this.setTransform({ x: newX, y: newY, scale: newScale });
  }

  private handlePanStart(pointer: { clientX: number; clientY: number }): void {
    this.isDragging = true;
    const rect = this.svg.getBoundingClientRect();
    this.lastPointerPosition = {
      x: pointer.clientX - rect.left,
      y: pointer.clientY - rect.top,
    };
    this.svg.style.cursor = 'grabbing';
  }

  private handlePanMove(pointer: { clientX: number; clientY: number }): void {
    if (!this.isDragging) return;

    const rect = this.svg.getBoundingClientRect();
    const currentPointerPosition = {
      x: pointer.clientX - rect.left,
      y: pointer.clientY - rect.top,
    };

    const deltaX = currentPointerPosition.x - this.lastPointerPosition.x;
    const deltaY = currentPointerPosition.y - this.lastPointerPosition.y;

    this.setTransform({
      x: this.transform.x + deltaX,
      y: this.transform.y + deltaY,
      scale: this.transform.scale,
    });

    this.lastPointerPosition = currentPointerPosition;
  }

  private handlePanEnd(): void {
    this.isDragging = false;
    this.svg.style.cursor = 'grab';
  }

  private screenToSVG(screenX: number, screenY: number): { x: number; y: number } {
    return {
      x: (screenX - this.transform.x) / this.transform.scale,
      y: (screenY - this.transform.y) / this.transform.scale,
    };
  }

  private setTransform(newTransform: ViewTransform): void {
    this.transform = { ...newTransform };
    this.updateTransform();
    this.onTransformChange?.(this.transform);
  }

  private updateTransform(): void {
    const transformString = `translate(${this.transform.x}, ${this.transform.y}) scale(${this.transform.scale})`;
    this.viewportGroup.setAttribute('transform', transformString);
  }

  // Public API
  getViewportGroup(): SVGGElement {
    return this.viewportGroup;
  }

  getTransform(): ViewTransform {
    return { ...this.transform };
  }

  resetView(): void {
    this.setTransform({ x: 0, y: 0, scale: 1 });
  }

  fitToContent(padding = 50): void {
    const bbox = this.viewportGroup.getBBox();
    if (bbox.width === 0 || bbox.height === 0) return;

    const svgRect = this.svg.getBoundingClientRect();
    const availableWidth = svgRect.width - 2 * padding;
    const availableHeight = svgRect.height - 2 * padding;

    const scaleX = availableWidth / bbox.width;
    const scaleY = availableHeight / bbox.height;
    const scale = Math.min(scaleX, scaleY, 1); // Don't zoom in beyond 100%

    const centerX = (svgRect.width - bbox.width * scale) / 2;
    const centerY = (svgRect.height - bbox.height * scale) / 2;
    const x = centerX - bbox.x * scale;
    const y = centerY - bbox.y * scale;

    this.setTransform({ x, y, scale });
  }

  onTransformChanged(callback: (transform: ViewTransform) => void): void {
    this.onTransformChange = callback;
  }

  destroy(): void {
    // Remove event listeners would go here if needed
    this.svg.style.cursor = '';
  }
}
