import type { Border } from './border';
import { DEFAULT_BORDER_WIDTH } from './border';
import { DEFAULT_PADDING, type Padding } from './padding';

export interface ContainerNodeStyle {
  backgroundColor?: string;
  border?: Border;
  opacity?: number;
  wireframe?: boolean;
  wireframeColor?: string;
  padding?: Padding;
}

export const DEFAULT_CONTAINER_NODE_STYLE: Required<ContainerNodeStyle> = {
  backgroundColor: 'green',
  border: { color: 'blue', width: DEFAULT_BORDER_WIDTH },
  opacity: 0.6,
  wireframe: false,
  wireframeColor: 'green',
  padding: DEFAULT_PADDING,
} as const;
