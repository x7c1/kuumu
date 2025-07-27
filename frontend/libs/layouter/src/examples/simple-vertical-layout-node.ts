import type { VerticalLayoutNode } from '../node';

export const simpleVerticalLayoutNode = (): VerticalLayoutNode => ({
  kind: 'vertical',
  tag: 'simple-vertical',
  items: [
    {
      kind: 'text',
      tag: 'top-text',
      item: 'Top Item',
    },
    {
      kind: 'text',
      tag: 'middle-text',
      item: 'Middle Item',
    },
    {
      kind: 'text',
      tag: 'bottom-text',
      item: 'Bottom Item',
    },
  ],
});
