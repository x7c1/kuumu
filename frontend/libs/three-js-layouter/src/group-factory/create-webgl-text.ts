import { DEFAULT_TEXT_NODE_STYLE, type TextNodeStyle } from '@kuumu/layouter/style';
import * as THREE from 'three';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import type { Font } from 'three/examples/jsm/loaders/FontLoader.js';
import type { GroupFactoryContext } from './context';
import { createWebGLTextCreationError, type GroupFactoryError } from './error';
import type { FontWithTypedData } from './font-types';

export function createWebGLText(
  context: GroupFactoryContext,
  text: string,
  style?: TextNodeStyle
): THREE.Mesh | GroupFactoryError {
  const { font } = context;
  const fontSize = style?.fontSize ?? DEFAULT_TEXT_NODE_STYLE.fontSize;
  const color = style?.color ?? DEFAULT_TEXT_NODE_STYLE.color;

  try {
    const textGeometry = new TextGeometry(text, {
      font: font,
      size: fontSize,
      depth: 0,
      curveSegments: 12,
      bevelEnabled: false,
      bevelThickness: 0,
      bevelSize: 0,
      bevelOffset: 0,
      bevelSegments: 0,
    });
    const opacity = style?.opacity ?? DEFAULT_TEXT_NODE_STYLE.opacity;
    const transparent = opacity < 1.0;
    const textMaterial = new THREE.MeshBasicMaterial({
      color,
      transparent,
      opacity,
    });
    const webglText = new THREE.Mesh(textGeometry, textMaterial);

    // Center the text using font metrics for proper baseline alignment
    const { centerX, baselineY } = computeTextSizeWithBaseline(webglText, font, fontSize);
    webglText.position.set(-centerX, -baselineY, 0);

    return webglText;
  } catch (error) {
    return createWebGLTextCreationError(error);
  }
}

function computeTextSizeWithBaseline(webglText: THREE.Mesh, font: Font, fontSize: number) {
  webglText.geometry.computeBoundingBox();
  const bbox = webglText.geometry.boundingBox!;

  const centerX = (bbox.max.x + bbox.min.x) / 2;
  const centerY = (bbox.max.y + bbox.min.y) / 2;

  // Try to calculate baseline using font metrics
  const baselineY = calculateVisualCenterBaseline(font, fontSize);
  if (baselineY !== null) {
    return { centerX, centerY, baselineY };
  }

  // Fallback to geometric center if font metrics unavailable
  return { centerX, centerY, baselineY: centerY };
}

/**
 * Calculate baseline position for optimal visual centering of text.
 *
 * Font Coordinate System Overview:
 * - Digital fonts use an internal coordinate system called "Units Per Em" (UPM)
 * - UPM is the number of units in the font's coordinate grid per em square
 * - Common values: 1000 (PostScript/older fonts), 2048 (modern TrueType/OpenType)
 * - Think of it as the "resolution" of the font's design grid
 *
 * Historical Context:
 * - "Em" originally referred to the width of the letter "M" in metal type
 * - Digital fonts kept this concept but use arbitrary numerical grids
 * - All font measurements (ascender, descender, etc.) are defined in these units
 *
 * Conversion Process:
 * 1. Extract ascender value from font data (in font units)
 * 2. Calculate scale factor: fontSize / unitsPerEm
 * 3. Convert font units to actual pixel/Three.js units
 * 4. Estimate cap height (height of capital letters like "A", "B")
 * 5. Calculate visual center as cap height / 2 from baseline
 *
 * Example:
 * - Font internal ascender = 800 units, UPM = 1000, fontSize = 16px
 * - Scale = 16/1000 = 0.016
 * - Actual ascender height = 800 * 0.016 = 12.8px
 * - Cap height ≈ 12.8 * 0.6 = 7.68px
 * - Visual center = 7.68 / 2 = 3.84px from baseline
 */
function calculateVisualCenterBaseline(font: Font, fontSize: number): number | null {
  // WORKAROUND: Three.js types define Font.data as string, but runtime value is object
  // Using type assertion to access actual font metrics for proper text positioning
  const fontData = (font as unknown as FontWithTypedData).data;
  if (!fontData || typeof fontData !== 'object' || !fontData.boundingBox) {
    return null;
  }

  // Units Per Em: the resolution of the font's internal coordinate system
  // Typical values: 1000 (PostScript), 2048 (modern TrueType/OpenType)
  const unitsPerEm = fontData.resolution || 1000;

  // Ascender: highest point of characters like "b", "d", "h" (in font units)
  const ascender = fontData.boundingBox.yMax || fontData.ascender || 800;

  // Convert font units to Three.js/pixel units
  const scale = fontSize / unitsPerEm;
  const ascenderHeight = ascender * scale;

  // Cap height: approximate height of capital letters (typically 60-70% of ascender)
  const capHeight = ascenderHeight * 0.6;

  // Visual center: positioned at half the cap height from baseline
  // This places the visual "weight" of text at the container's center
  const visualCenterFromBaseline = capHeight / 2;

  return visualCenterFromBaseline;
}
