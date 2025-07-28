import type { ContainerNode } from './container-node';
import { isContainerNode } from './container-node';
import type { HorizontalLayoutNode } from './horizontal-layout-node';
import { isHorizontalLayoutNode } from './horizontal-layout-node';
import type { TextNode } from './text-node';
import type { VerticalLayoutNode } from './vertical-layout-node';
import { isVerticalLayoutNode } from './vertical-layout-node';

export type Node = VerticalLayoutNode | HorizontalLayoutNode | ContainerNode | TextNode;

export function traverseNode(node: Node, callback: (node: Node) => void): void {
  callback(node);

  if (isVerticalLayoutNode(node) || isHorizontalLayoutNode(node)) {
    node.items.forEach((child) => traverseNode(child, callback));
  } else if (isContainerNode(node)) {
    traverseNode(node.item, callback);
  }
}
