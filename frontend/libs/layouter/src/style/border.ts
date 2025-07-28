import { px } from '../scaling';

export interface Border {
  color?: string;
  width?: number;
}

export const DEFAULT_BORDER_WIDTH = px(1); // 1px border
