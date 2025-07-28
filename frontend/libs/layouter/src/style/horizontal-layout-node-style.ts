import type { Border } from './border';
import { DEFAULT_LAYOUT_NODE_STYLE, type LayoutNodeStyle } from './layout-node-style';

export type HorizontalAlignment = 'center' | 'top';

export interface HorizontalLayoutNodeStyle extends LayoutNodeStyle {
  backgroundColor?: string;
  border?: Border;
  opacity?: number;
  wireframe?: boolean;
  wireframeColor?: string;
  alignment?: HorizontalAlignment;
}

export const DEFAULT_HORIZONTAL_LAYOUT_NODE_STYLE: Required<HorizontalLayoutNodeStyle> = {
  ...DEFAULT_LAYOUT_NODE_STYLE,
  alignment: 'center',
} as const;
