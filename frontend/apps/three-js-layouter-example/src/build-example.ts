import {
  simpleContainerNode,
  simpleHorizontalLayoutNode,
  simpleVerticalLayoutNode,
} from '@kuumu/layouter/examples';
import {
  isTextNode,
  type Node,
  traverseNode,
  updateContainerNodeStyle,
  updateHorizontalLayoutNodeStyle,
  updateTextNodeStyle,
  updateVerticalLayoutNodeStyle,
} from '@kuumu/layouter/node';
import {
  createGroup,
  type GroupFactoryContext,
  type GroupFactoryError,
} from '@kuumu/three-js-layouter/group-factory';
import type { Group } from 'three';
import type { Font } from 'three/examples/jsm/loaders/FontLoader.js';
import type { HeightMode, HorizontalAlignment, VerticalAlignment } from './models';

const EXAMPLE_TYPES = ['simple-container', 'simple-horizontal', 'simple-vertical'] as const;

export type ExampleType = (typeof EXAMPLE_TYPES)[number];

export function isValidExampleType(value: string | null): value is ExampleType {
  return EXAMPLE_TYPES.includes(value as ExampleType);
}

type SimpleContainerParams = {
  type: 'simple-container';
  font: Font;
  wireframe?: boolean;
  heightMode?: HeightMode;
};

type SimpleHorizontalParams = {
  type: 'simple-horizontal';
  font: Font;
  alignment: HorizontalAlignment;
  wireframe?: boolean;
  heightMode?: HeightMode;
};

type SimpleVerticalParams = {
  type: 'simple-vertical';
  font: Font;
  verticalAlignment: VerticalAlignment;
  wireframe?: boolean;
  heightMode?: HeightMode;
};

export type ExampleParams = SimpleContainerParams | SimpleHorizontalParams | SimpleVerticalParams;

export function buildExample(params: ExampleParams): Group | GroupFactoryError {
  const context: GroupFactoryContext = { font: params.font };
  const node = createNode(params);
  return createGroup(context, node);
}

function createNode(params: ExampleParams): Node {
  let node: Node;

  switch (params.type) {
    case 'simple-container':
      node = simpleContainerNode();
      updateContainerNodeStyle(node, {
        wireframe: params.wireframe,
      });
      break;
    case 'simple-horizontal':
      node = simpleHorizontalLayoutNode();
      updateHorizontalLayoutNodeStyle(node, {
        alignment: params.alignment,
        wireframe: params.wireframe,
      });
      break;
    case 'simple-vertical':
      node = simpleVerticalLayoutNode();
      updateVerticalLayoutNodeStyle(node, {
        alignment: params.verticalAlignment,
        wireframe: params.wireframe,
      });
      break;
  }

  // Apply heightMode, wireframe, and responsive scaling to all TextNodes using traverseNode
  traverseNode(node, (currentNode) => {
    if (isTextNode(currentNode)) {
      const textStyle: Parameters<typeof updateTextNodeStyle>[1] = {};
      if (params.heightMode !== undefined) {
        textStyle.heightMode = params.heightMode;
      }
      if (params.wireframe !== undefined) {
        textStyle.wireframe = params.wireframe;
      }
      updateTextNodeStyle(currentNode, textStyle);
    }
  });

  return node;
}
