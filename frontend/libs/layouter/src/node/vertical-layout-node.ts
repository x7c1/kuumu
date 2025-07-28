import type { VerticalLayoutNodeStyle } from '../style';
import type { Node } from './node';

export interface VerticalLayoutNode {
  kind: 'vertical';
  tag?: string;
  items: Node[];
  style?: VerticalLayoutNodeStyle;
}

export function isVerticalLayoutNode(node: Node): node is VerticalLayoutNode {
  return node.kind === 'vertical';
}

export function updateVerticalLayoutNodeStyle(
  node: VerticalLayoutNode,
  style: Partial<VerticalLayoutNodeStyle>
): void {
  node.style = { ...node.style, ...style };
}
