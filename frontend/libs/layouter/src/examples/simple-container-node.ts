import type { ContainerNode } from '../node';

export const simpleContainerNode = (): ContainerNode => ({
  kind: 'container',
  tag: 'simple-container',
  item: {
    kind: 'text',
    tag: 'inner-text',
    item: 'こんにちは Container Node!!',
  },
});
