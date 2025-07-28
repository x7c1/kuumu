import type { Node, TextNode } from '@kuumu/layouter/node';
import { rem } from '@kuumu/layouter/scaling';
import { DEFAULT_TEXT_NODE_STYLE } from '@kuumu/layouter/style';
import * as THREE from 'three';
import type { GroupFactoryContext } from './context';
import { createWebGLText } from './create-webgl-text';
import type { GroupFactoryError } from './error';
import { isGroupFactoryError } from './error';
import { createLayoutGroup, type LayoutOperations } from './shared-layout-utilities';

// Create visual representation of TextNode
export function createTextNodeGroup(
  context: GroupFactoryContext,
  textNode: TextNode
): THREE.Group | GroupFactoryError {
  // Pre-create WebGL text to get dimensions for geometry calculation
  const webglText = createWebGLText(context, textNode.item, textNode.style);
  if (isGroupFactoryError(webglText)) {
    return webglText;
  }
  const operations: LayoutOperations<TextNode> = {
    getItems,
    positionChildren,
    createGeometry: () => createGeometry(webglText, textNode),
  };

  const result = createLayoutGroup(context, textNode, operations);
  if (isGroupFactoryError(result)) {
    return result;
  }

  // Add the WebGL text after the layout group is created
  result.add(webglText);

  return result;
}

// Get items for text node (no children)
function getItems(): Node[] {
  return [];
}

// Position children for text node (no-op)
function positionChildren(): void {
  // TextNode has no children to position
}

// Create geometry for text node
function createGeometry(
  webglText: THREE.Mesh,
  textNode: TextNode
): {
  geometry: THREE.BoxGeometry;
  centerPosition: THREE.Vector3;
} {
  const { textWidth, textHeight } = computeTextSize(webglText, textNode);

  return {
    geometry: new THREE.BoxGeometry(textWidth, textHeight, 0),
    centerPosition: new THREE.Vector3(0, 0, 0), // TextNode stays at origin
  };
}

function computeTextSize(webglText: THREE.Mesh, textNode: TextNode) {
  let bbox = webglText.geometry.boundingBox;
  if (!bbox) {
    // If bounding box is not computed, we can compute it manually
    webglText.geometry.computeBoundingBox();
    bbox = webglText.geometry.boundingBox!;
  }
  const horizontalPadding = rem(0.5);
  const textWidth = bbox.max.x - bbox.min.x + horizontalPadding;

  const heightMode = textNode.style?.heightMode ?? DEFAULT_TEXT_NODE_STYLE.heightMode;
  const fontSize = textNode.style?.fontSize ?? DEFAULT_TEXT_NODE_STYLE.fontSize;
  const verticalPadding = fontSize * 0.6;

  let textHeight: number;
  if (heightMode === 'fixed') {
    // Use fixed height based on font size with padding
    textHeight = fontSize + verticalPadding;
  } else {
    // Use dynamic height based on actual text bounding box
    const bboxHeight = bbox.max.y - bbox.min.y;
    textHeight = bboxHeight + verticalPadding;
  }

  return { textWidth, textHeight };
}
