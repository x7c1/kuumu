import type { Node } from '@kuumu/layouter/node';
import {
  isContainerNode,
  isHorizontalLayoutNode,
  isTextNode,
  isVerticalLayoutNode,
} from '@kuumu/layouter/node';
import type * as THREE from 'three';
import type { GroupFactoryContext } from './context';
import { createContainerNodeGroup } from './create-container-node-group';
import { createHorizontalLayoutNodeGroup } from './create-horizontal-layout-node-group';
import { createTextNodeGroup } from './create-text-node-group';
import { createVerticalLayoutNodeGroup } from './create-vertical-layout-node-group';
import { createUnsupportedNodeTypeError, type GroupFactoryError } from './error';

// Create THREE.Group from Node
// Returns GroupFactoryError when the node type is not supported
export function createGroup(
  context: GroupFactoryContext,
  node: Node
): THREE.Group | GroupFactoryError {
  if (isTextNode(node)) {
    return createTextNodeGroup(context, node);
  }
  if (isContainerNode(node)) {
    return createContainerNodeGroup(context, node);
  }
  if (isHorizontalLayoutNode(node)) {
    return createHorizontalLayoutNodeGroup(context, node);
  }
  if (isVerticalLayoutNode(node)) {
    return createVerticalLayoutNodeGroup(context, node);
  }
  return createUnsupportedNodeTypeError(node);
}
