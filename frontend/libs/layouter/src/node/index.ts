/**
 * Core layout node type definitions for declarative layout structures
 */

// Re-export all specific node types and utilities
export type { ContainerNode } from './container-node';
export { isContainerNode, updateContainerNodeStyle } from './container-node';
export type { HorizontalLayoutNode } from './horizontal-layout-node.js';
export {
  isHorizontalLayoutNode,
  updateHorizontalLayoutNodeStyle,
} from './horizontal-layout-node.js';
export type { Node } from './node';
export { traverseNode } from './node';
export type { TextNode } from './text-node';
export { isTextNode, updateTextNodeStyle } from './text-node';
export type { VerticalLayoutNode } from './vertical-layout-node.js';
export {
  isVerticalLayoutNode,
  updateVerticalLayoutNodeStyle,
} from './vertical-layout-node.js';
