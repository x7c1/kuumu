import type { Border } from './border';
import { DEFAULT_LAYOUT_NODE_STYLE, type LayoutNodeStyle } from './layout-node-style';

export interface VerticalLayoutNodeStyle extends LayoutNodeStyle {
  backgroundColor?: string;
  border?: Border;
  opacity?: number;
  wireframe?: boolean;
  wireframeColor?: string;
}

export const DEFAULT_VERTICAL_LAYOUT_NODE_STYLE: Required<VerticalLayoutNodeStyle> = {
  ...DEFAULT_LAYOUT_NODE_STYLE,
} as const;
