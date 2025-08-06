import type { Font } from 'three/examples/jsm/loaders/FontLoader.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TTFLoader } from 'three/examples/jsm/loaders/TTFLoader.js';

// WebGL-based text rendering
const fontCache = new Map<string, Font>();

/**
 * Loads a font from the specified relative path
 * @param fontPath - Relative path to the font file (must be a .ttf or .otf file)
 * @returns Promise that resolves to the loaded Font or null if loading fails
 * @throws Error if the font path is invalid or not relative
 */
export async function loadFont(fontPath: string): Promise<Font | null> {
  validateRelativeFontPath(fontPath);

  const cachedFont = fontCache.get(fontPath);
  if (cachedFont) return cachedFont;

  return new Promise((resolve) => {
    const ttfLoader = new TTFLoader();

    ttfLoader.load(
      fontPath,
      (fontData) => {
        const fontLoader = new FontLoader();
        const font = fontLoader.parse(fontData);

        // Apply metrics correction to fix vertical positioning
        applyMetricsCorrection(font);

        fontCache.set(fontPath, font);
        console.log(`✓ Font loaded: ${fontPath}`);
        resolve(font);
      },
      undefined,
      (error) => {
        console.warn(`⚠️ Font loading failed: ${fontPath}`, error);
        resolve(null);
      }
    );
  });
}

/**
 * Validates that the font path is a relative path
 * @param fontPath - The font path to validate
 * @throws Error if the path is not relative or is invalid
 */
function validateRelativeFontPath(fontPath: string): void {
  if (!fontPath) {
    throw new Error('Font path cannot be empty');
  }

  if (fontPath.startsWith('/') || fontPath.startsWith('http://') || fontPath.startsWith('https://')) {
    throw new Error('Only relative font paths are supported. Absolute paths and URLs are not allowed.');
  }

  if (!fontPath.endsWith('.ttf') && !fontPath.endsWith('.otf')) {
    throw new Error('Font path must point to a .ttf or .otf file');
  }
}

/**
 * Apply metrics correction to fix vertical positioning issues
 * when converting from JSON to TTF font loading
 */
function applyMetricsCorrection(font: Font): void {
  // Adjust boundingBox to match JSON font behavior
  if (font.data && font.data.boundingBox) {
    const bbox = font.data.boundingBox;

    // Apply vertical offset correction
    // This compensates for the difference between JSON and TTF baseline calculations
    const verticalOffset = bbox.yMax * 0.37; // Adjust this value as needed

    bbox.yMin += verticalOffset;
    bbox.yMax += verticalOffset;
  }

  // Log metrics for debugging
  console.log('Font metrics after correction:', {
    boundingBox: font.data?.boundingBox,
    resolution: font.data?.resolution,
    underlineThickness: font.data?.underlineThickness
  });
}
