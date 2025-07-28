import type { ContainerNode, Node } from '@kuumu/layouter/node';
import { DEFAULT_CONTAINER_NODE_STYLE } from '@kuumu/layouter/style';
import type * as THREE from 'three';
import type { GroupFactoryContext } from './context';
import type { GroupFactoryError } from './error';
import {
  createLayoutGroup,
  createNodeGeometry,
  type LayoutOperations,
  type NodeGeometry,
} from './shared-layout-utilities';

// Create visual representation of ContainerNode
export function createContainerNodeGroup(
  context: GroupFactoryContext,
  containerNode: ContainerNode
): THREE.Group | GroupFactoryError {
  const operations: LayoutOperations<ContainerNode> = {
    getItems,
    positionChildren,
    createGeometry: (group) => createGeometry(group, containerNode),
  };
  return createLayoutGroup(context, containerNode, operations);
}

// Get items for container node
function getItems(node: ContainerNode): Node[] {
  return [node.item];
}

// Position children for container node
function positionChildren(): void {}

// Create geometry for container node
function createGeometry(group: THREE.Group, node: ContainerNode): NodeGeometry {
  const padding = node.style?.padding ?? DEFAULT_CONTAINER_NODE_STYLE.padding;
  return createNodeGeometry(group, padding);
}
