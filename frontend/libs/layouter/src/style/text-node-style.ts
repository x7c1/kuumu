import { px } from '../scaling';

export interface TextNodeStyle {
  color?: string;
  fontSize?: number;
  opacity?: number;
  backgroundColor?: string;
  wireframe?: boolean;
  wireframeColor?: string;
  heightMode?: 'fixed' | 'dynamic';
}

export const DEFAULT_TEXT_NODE_STYLE: Required<TextNodeStyle> = {
  color: 'black',
  fontSize: px(14),
  opacity: 1.0,
  backgroundColor: 'white',
  wireframe: false,
  wireframeColor: 'green',
  heightMode: 'dynamic',
} as const;
