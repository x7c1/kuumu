import { px } from '../scaling';
import { type ContainerNodeStyle, DEFAULT_CONTAINER_NODE_STYLE } from './container-node-style';

export interface LayoutNodeStyle extends ContainerNodeStyle {
  spacing?: number;
}

export const DEFAULT_LAYOUT_NODE_STYLE: Required<LayoutNodeStyle> = {
  ...DEFAULT_CONTAINER_NODE_STYLE,
  spacing: px(2),
} as const;
