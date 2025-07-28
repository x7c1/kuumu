/**
 * Font type definitions to work around Three.js type system limitations.
 *
 * PROBLEM:
 * Three.js FontLoader defines Font.data as 'string' in TypeScript, but the actual
 * runtime value is an object containing font metrics and glyph data. This is a
 * bug in Three.js type definitions (@types/three).
 *
 * SOLUTION:
 * Define correct types here and use type assertion to access the real data structure.
 * This allows type-safe access to font metrics needed for proper text positioning.
 *
 * References:
 * - Three.js FontLoader: three/examples/jsm/loaders/FontLoader.js
 * - Incorrect type: @types/three/examples/jsm/loaders/FontLoader.d.ts
 */

/**
 * Actual structure of font data loaded by Three.js FontLoader.
 * This represents the parsed JSON font file content.
 */
export interface FontData {
  /** Units per em - the resolution of font's coordinate system (typically 1000 or 2048) */
  resolution: number;

  /** Font bounding box containing ascender and descender information */
  boundingBox: {
    /** Ascender line - highest point of characters like 'b', 'd', 'h' */
    yMax: number;
    /** Descender line - lowest point of characters like 'g', 'j', 'p' */
    yMin: number;
  };

  /** Alternative ascender value (font-specific) */
  ascender?: number;

  /** Font family name */
  familyName?: string;

  /** Character glyph definitions with outline data */
  glyphs: Record<string, unknown>;
}

/**
 * Corrected Font interface with properly typed data property.
 * Use this interface with type assertion to access font metrics safely.
 */
export interface FontWithTypedData {
  /** The actual font data object (not string as Three.js types claim) */
  data: FontData;
}
