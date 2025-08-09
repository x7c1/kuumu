import type { Node, VerticalLayoutNode } from '@kuumu/layouter/node';
import { DEFAULT_VERTICAL_LAYOUT_NODE_STYLE } from '@kuumu/layouter/style';
import * as THREE from 'three';
import type { GroupFactoryContext } from './context';
import type { GroupFactoryError } from './error';
import {
  createLayoutGroup,
  createNodeGeometry,
  type LayoutOperations,
  type NodeGeometry,
} from './shared-layout-utilities';

// Create visual representation of VerticalLayoutNode
export function createVerticalLayoutNodeGroup(
  context: GroupFactoryContext,
  verticalLayoutNode: VerticalLayoutNode
): THREE.Group | GroupFactoryError {
  const operations: LayoutOperations<VerticalLayoutNode> = {
    getItems,
    positionChildren: (children) => positionChildren(children, verticalLayoutNode),
    createGeometry: (group) => createGeometry(group, verticalLayoutNode),
  };
  return createLayoutGroup(context, verticalLayoutNode, operations);
}

// Get items for vertical layout node
function getItems(node: VerticalLayoutNode): Node[] {
  return node.items;
}

// Position children for vertical layout node
function positionChildren(children: THREE.Group[], node: VerticalLayoutNode): void {
  const spacing = node.style?.spacing ?? DEFAULT_VERTICAL_LAYOUT_NODE_STYLE.spacing; // Space between items
  const alignment = node.style?.alignment || 'left';

  positionItemsVertically(children, spacing);
  applyHorizontalAlignment(children, alignment);
}

// Create geometry for vertical layout node
function createGeometry(group: THREE.Group, node: VerticalLayoutNode): NodeGeometry {
  const padding = node.style?.padding ?? DEFAULT_VERTICAL_LAYOUT_NODE_STYLE.padding;
  return createNodeGeometry(group, padding);
}

// Position items vertically with spacing
function positionItemsVertically(itemGroups: THREE.Group[], spacing: number): void {
  let yOffset = 0;
  for (const itemGroup of itemGroups) {
    // Calculate bounding box to determine positioning
    const box = new THREE.Box3().setFromObject(itemGroup);
    const size = box.getSize(new THREE.Vector3());

    // Position the item vertically (from top to bottom)
    itemGroup.position.y = yOffset - size.y / 2;

    // Update offset for next item (move down)
    yOffset -= size.y + spacing;
  }
}

// Apply center alignment to items
function applyCenterAlignment(itemGroups: THREE.Group[]): void {
  // Calculate the leftmost left position among all items
  let leftmostLeft = Infinity;
  let rightmostRight = -Infinity;
  for (const itemGroup of itemGroups) {
    const box = new THREE.Box3().setFromObject(itemGroup);
    leftmostLeft = Math.min(leftmostLeft, box.min.x);
    rightmostRight = Math.max(rightmostRight, box.max.x);
  }

  // Calculate center offset
  const totalWidth = rightmostRight - leftmostLeft;
  const centerOffset = -totalWidth / 2 - leftmostLeft;

  // Align all items to center
  for (const itemGroup of itemGroups) {
    itemGroup.position.x = centerOffset;
  }
}

// Apply left alignment to items
function applyLeftAlignment(itemGroups: THREE.Group[]): void {
  // Calculate the leftmost position among all items
  let leftmostLeft = Infinity;
  for (const itemGroup of itemGroups) {
    const box = new THREE.Box3().setFromObject(itemGroup);
    leftmostLeft = Math.min(leftmostLeft, box.min.x);
  }

  // Move all items so their left edges align to x=0
  for (const itemGroup of itemGroups) {
    const box = new THREE.Box3().setFromObject(itemGroup);
    const leftOffset = -box.min.x;
    itemGroup.position.x = leftOffset;
  }
}

// Apply horizontal alignment to items
function applyHorizontalAlignment(itemGroups: THREE.Group[], alignment: string): void {
  if (alignment === 'center') {
    applyCenterAlignment(itemGroups);
  } else {
    applyLeftAlignment(itemGroups);
  }
}
