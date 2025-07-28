import type { HorizontalLayoutNodeStyle } from '../style';
import type { Node } from './node';

export interface HorizontalLayoutNode {
  kind: 'horizontal';
  tag?: string;
  items: Node[];
  style?: HorizontalLayoutNodeStyle;
}

export function isHorizontalLayoutNode(node: Node): node is HorizontalLayoutNode {
  return node.kind === 'horizontal';
}

export function updateHorizontalLayoutNodeStyle(
  node: HorizontalLayoutNode,
  style: Partial<HorizontalLayoutNodeStyle>
): void {
  node.style = { ...node.style, ...style };
}
