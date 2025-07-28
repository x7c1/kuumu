import type { HorizontalLayoutNode, Node } from '@kuumu/layouter/node';
import { DEFAULT_HORIZONTAL_LAYOUT_NODE_STYLE } from '@kuumu/layouter/style';
import * as THREE from 'three';
import type { GroupFactoryContext } from './context';
import type { GroupFactoryError } from './error';
import {
  createLayoutGroup,
  createNodeGeometry,
  type LayoutOperations,
  type NodeGeometry,
} from './shared-layout-utilities';

// Create visual representation of HorizontalLayoutNode
export function createHorizontalLayoutNodeGroup(
  context: GroupFactoryContext,
  horizontalLayoutNode: HorizontalLayoutNode
): THREE.Group | GroupFactoryError {
  const operations: LayoutOperations<HorizontalLayoutNode> = {
    getItems,
    positionChildren: (children) => positionChildren(children, horizontalLayoutNode),
    createGeometry: (group) => createGeometry(group, horizontalLayoutNode),
  };
  return createLayoutGroup(context, horizontalLayoutNode, operations);
}

// Get items for horizontal layout node
function getItems(node: HorizontalLayoutNode): Node[] {
  return node.items;
}

// Position children for horizontal layout node
function positionChildren(children: THREE.Group[], node: HorizontalLayoutNode): void {
  const spacing = node.style?.spacing ?? DEFAULT_HORIZONTAL_LAYOUT_NODE_STYLE.spacing; // Space between items
  const alignment = node.style?.alignment || 'center';

  positionItemsHorizontally(children, spacing);
  applyVerticalAlignment(children, alignment);
}

// Create geometry for horizontal layout node
function createGeometry(group: THREE.Group, node: HorizontalLayoutNode): NodeGeometry {
  const padding = node.style?.padding ?? DEFAULT_HORIZONTAL_LAYOUT_NODE_STYLE.padding;
  return createNodeGeometry(group, padding);
}

// Position items horizontally with spacing
function positionItemsHorizontally(itemGroups: THREE.Group[], spacing: number): void {
  let xOffset = 0;
  for (const itemGroup of itemGroups) {
    // Calculate bounding box to determine positioning
    const box = new THREE.Box3().setFromObject(itemGroup);
    const size = box.getSize(new THREE.Vector3());

    // Position the item horizontally
    itemGroup.position.x = xOffset + size.x / 2;

    // Update offset for next item
    xOffset += size.x + spacing;
  }
}

// Apply vertical alignment to items
function applyVerticalAlignment(itemGroups: THREE.Group[], alignment: string): void {
  if (alignment === 'top') {
    // Calculate the highest top position among all items
    let highestTop = -Infinity;
    for (const itemGroup of itemGroups) {
      const box = new THREE.Box3().setFromObject(itemGroup);
      highestTop = Math.max(highestTop, box.max.y);
    }

    // Align all items to the highest top
    for (const itemGroup of itemGroups) {
      const box = new THREE.Box3().setFromObject(itemGroup);
      const currentTop = box.max.y;
      const yAdjustment = highestTop - currentTop;
      itemGroup.position.y = yAdjustment;
    }
  }
  // For 'center' alignment, items remain at y=0 (default)
}
