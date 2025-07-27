import { px } from '../scaling';

export interface Padding {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

export const DEFAULT_PADDING: Required<Padding> = {
  top: px(2),
  right: px(2),
  bottom: px(2),
  left: px(2),
} as const;
