import type { HorizontalLayoutNode } from '../node';

export const simpleHorizontalLayoutNode = (): HorizontalLayoutNode => ({
  kind: 'horizontal',
  tag: 'simple-horizontal',
  items: [
    {
      kind: 'text',
      tag: 'left-text',
      item: 'Left Item',
    },
    {
      kind: 'text',
      tag: 'center-text',
      item: 'Center Item',
    },
    {
      kind: 'text',
      tag: 'right-text',
      item: 'Right Item',
    },
  ],
});
