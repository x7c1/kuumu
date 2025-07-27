import type { TextNodeStyle } from '../style';
import type { Node } from './node';

export interface TextNode {
  kind: 'text';
  tag?: string;
  item: string;
  style?: TextNodeStyle;
}

export function isTextNode(node: Node): node is TextNode {
  return node.kind === 'text';
}

export function updateTextNodeStyle(node: TextNode, style: Partial<TextNodeStyle>): void {
  node.style = { ...node.style, ...style };
}
