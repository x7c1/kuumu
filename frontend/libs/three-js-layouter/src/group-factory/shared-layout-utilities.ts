import type { Node } from '@kuumu/layouter/node';
import {
  DEFAULT_CONTAINER_NODE_STYLE,
  DEFAULT_HORIZONTAL_LAYOUT_NODE_STYLE,
  DEFAULT_PADDING,
  DEFAULT_TEXT_NODE_STYLE,
  DEFAULT_VERTICAL_LAYOUT_NODE_STYLE,
  type Padding,
} from '@kuumu/layouter/style';
import * as THREE from 'three';
import type { GroupFactoryContext } from './context';
import { createGroup } from './create-group';
import type { GroupFactoryError } from './error';
import { isGroupFactoryError } from './error';

// Interface for style objects that support wireframe
interface WireframeStyle {
  backgroundColor?: string;
  opacity?: number;
  wireframe?: boolean;
  wireframeColor?: string;
}

// Interface for default style objects
interface DefaultStyle {
  backgroundColor: string;
  opacity: number;
  wireframe: boolean;
  wireframeColor: string;
}

// Result of child processing - contains both successful groups and errors
interface ChildProcessingResult {
  groups: THREE.Group[];
  errors: GroupFactoryError[];
}

// Node geometry with bounding box information
export interface NodeGeometry {
  geometry: THREE.BoxGeometry;
  centerPosition: THREE.Vector3;
}

// Operations for creating different layout types
export interface LayoutOperations<T> {
  getItems: (node: T) => Node[];
  positionChildren: (children: THREE.Group[], node: T) => void;
  createGeometry: (group: THREE.Group) => NodeGeometry;
}

// Template method pattern for creating layout groups
export function createLayoutGroup<T extends Node>(
  context: GroupFactoryContext,
  node: T,
  operations: LayoutOperations<T>
): THREE.Group | GroupFactoryError {
  const group = new THREE.Group();

  // Step 1: Process children
  const items = operations.getItems(node);
  const childResult = processItems(context, items);

  // If there's only one error and no successful groups, return the error
  if (childResult.groups.length === 0 && childResult.errors.length === 1) {
    return childResult.errors[0];
  }

  // Log errors but continue processing with successful groups
  if (childResult.errors.length > 0) {
    for (const error of childResult.errors) {
      console.error('Child processing error:', error);
    }
  }

  // Step 2: Add children to group
  for (const child of childResult.groups) {
    group.add(child);
  }

  // Step 3: Position children according to layout rules
  operations.positionChildren(childResult.groups, node);

  // Step 4: Create and add node itself
  const { geometry: nodeGeometry, centerPosition } = operations.createGeometry(group);
  const nodeMaterial = createMaterialFromNode(node);
  const nodeMesh = createAndPositionNodeMesh(nodeGeometry, nodeMaterial, centerPosition);
  group.add(nodeMesh);

  // Step 5: Apply Z-coordinate offsets for proper layering
  applyLayoutZOffsets(childResult.groups, nodeMesh);

  return group;
}

// Process items and create groups
function processItems(context: GroupFactoryContext, items: Node[]): ChildProcessingResult {
  const groups: THREE.Group[] = [];
  const errors: GroupFactoryError[] = [];

  for (const item of items) {
    const itemGroup = createGroup(context, item);
    if (isGroupFactoryError(itemGroup)) {
      errors.push(itemGroup);
      continue;
    }
    if (itemGroup) {
      groups.push(itemGroup);
    }
  }

  return { groups, errors };
}

// Create node geometry with padding
export function createNodeGeometry(group: THREE.Group, padding: Padding | number): NodeGeometry {
  // Convert number to Padding interface for uniform handling
  const pad =
    typeof padding === 'number'
      ? { top: padding, bottom: padding, left: padding, right: padding }
      : {
          top: padding.top ?? DEFAULT_PADDING.top,
          bottom: padding.bottom ?? DEFAULT_PADDING.bottom,
          left: padding.left ?? DEFAULT_PADDING.left,
          right: padding.right ?? DEFAULT_PADDING.right,
        };

  // Calculate bounding box of all children (excluding the node itself)
  const children = group.children.filter((child) => child.type === 'Group');

  if (children.length === 0) {
    return {
      geometry: new THREE.BoxGeometry(0.1, 0.1, 0),
      centerPosition: new THREE.Vector3(0, 0, 0),
    };
  }

  const box = new THREE.Box3();
  for (const child of children) {
    box.expandByObject(child);
  }

  const size = box.getSize(new THREE.Vector3());
  const boxCenter = box.getCenter(new THREE.Vector3());

  const nodeWidth = size.x + pad.left + pad.right;
  const nodeHeight = size.y + pad.top + pad.bottom;

  // Adjust center position when padding is asymmetric
  const centerX = boxCenter.x + (pad.right - pad.left) / 2;
  const centerY = boxCenter.y + (pad.top - pad.bottom) / 2;
  const center = new THREE.Vector3(centerX, centerY, boxCenter.z);

  return {
    geometry: new THREE.BoxGeometry(nodeWidth, nodeHeight, 0),
    centerPosition: center,
  };
}

// Apply Z-coordinate offsets for proper layering between children and node
function applyLayoutZOffsets(childGroups: THREE.Group[], nodeMesh: THREE.Mesh): void {
  // Position child groups in front of node
  childGroups.forEach((group) => {
    group.position.setZ(0.001);
  });

  // Position node mesh behind child groups
  nodeMesh.position.setZ(-0.001);
}

// Create and position node mesh
function createAndPositionNodeMesh(
  geometry: THREE.BoxGeometry,
  material: THREE.MeshBasicMaterial,
  centerPosition: THREE.Vector3
): THREE.Mesh {
  const nodeMesh = new THREE.Mesh(geometry, material);
  nodeMesh.position.copy(centerPosition);
  return nodeMesh;
}

// Get default style for a node
function getDefaultStyleForNode(node: Node): DefaultStyle {
  switch (node.kind) {
    case 'text':
      return DEFAULT_TEXT_NODE_STYLE;
    case 'container':
      return DEFAULT_CONTAINER_NODE_STYLE;
    case 'horizontal':
      return DEFAULT_HORIZONTAL_LAYOUT_NODE_STYLE;
    case 'vertical':
      return DEFAULT_VERTICAL_LAYOUT_NODE_STYLE;
    default: {
      // This should never happen with proper typing
      const _exhaustiveCheck: never = node;
      throw new Error(`Unknown node kind: ${(_exhaustiveCheck as Node).kind}`);
    }
  }
}

// Create material with wireframe support
export function createNodeMaterial(
  style: WireframeStyle | undefined,
  defaultStyle: DefaultStyle
): THREE.MeshBasicMaterial {
  const opacity = style?.opacity ?? defaultStyle.opacity;
  const transparent = opacity < 1.0;

  const wireframe = style?.wireframe ?? defaultStyle.wireframe;
  const color = wireframe
    ? (style?.wireframeColor ?? defaultStyle.wireframeColor)
    : (style?.backgroundColor ?? defaultStyle.backgroundColor);

  return new THREE.MeshBasicMaterial({
    color,
    transparent,
    opacity,
    wireframe,
  });
}

// Create material directly from node
export function createMaterialFromNode(node: Node): THREE.MeshBasicMaterial {
  const defaultStyle = getDefaultStyleForNode(node);
  return createNodeMaterial(node.style, defaultStyle);
}
