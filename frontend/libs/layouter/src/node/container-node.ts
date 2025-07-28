import type { ContainerNodeStyle } from '../style';
import type { Node } from './node';

export interface ContainerNode {
  kind: 'container';
  tag?: string;
  item: Node;
  style?: ContainerNodeStyle;
}

export function isContainerNode(node: Node): node is ContainerNode {
  return node.kind === 'container';
}

export function updateContainerNodeStyle(
  node: ContainerNode,
  style: Partial<ContainerNodeStyle>
): void {
  node.style = { ...node.style, ...style };
}
