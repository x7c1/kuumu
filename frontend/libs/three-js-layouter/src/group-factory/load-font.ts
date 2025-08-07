import type { Font } from 'three/examples/jsm/loaders/FontLoader.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TTFLoader } from 'three/examples/jsm/loaders/TTFLoader.js';

interface TTFLoaderResult {
  glyphs: Record<string, {
    ha: number;        // horizontal advance width
    x_min: number;     // minimum x coordinate
    x_max: number;     // maximum x coordinate
    o: string;         // outline commands as string
  }>;
  familyName: string;
  ascender: number;
  descender: number;
  underlinePosition: number;
  underlineThickness: number;
  boundingBox: {
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
  };
  resolution: number;
  original_font_information: unknown;
}

// WebGL-based text rendering
const fontCache = new Map<string, Font>();

const DB_NAME = 'FontCache';
const DB_VERSION = 1;
const STORE_NAME = 'fonts';

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

  const startTime = performance.now();
  console.log(`⏳ Loading font: ${fontPath}`);

  let fontData = await loadCachedTTF(fontPath);
  if (!fontData) {
    fontData = await loadTTF(fontPath);
    // Apply metrics correction to the raw font data before caching
    applyMetricsCorrection(fontData);
    await cacheTTF(fontPath, fontData);
  }

  const fontLoader = new FontLoader();
  const font = fontLoader.parse(fontData);

  const loadTime = Math.round(performance.now() - startTime);
  console.log(`✓ Font loaded: ${fontPath} (${loadTime}ms)`);

  fontCache.set(fontPath, font);
  return font;
}

/**
 * Loads cached TTF font data from IndexedDB
 * @param fontPath - Relative path to the font file
 * @returns Promise that resolves to font data or null if not cached
 */
async function loadCachedTTF(fontPath: string): Promise<TTFLoaderResult | null> {
  return new Promise((resolve) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => resolve(null);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const getRequest = store.get(fontPath);

      getRequest.onsuccess = () => {
        resolve(getRequest.result || null);
      };

      getRequest.onerror = () => resolve(null);
    };
  });
}

/**
 * Caches TTF font data to IndexedDB
 * @param fontPath - Relative path to the font file
 * @param fontData - Font data to cache
 */
async function cacheTTF(fontPath: string, fontData: TTFLoaderResult): Promise<void> {
  return new Promise((resolve) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => resolve();

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const putRequest = store.put(fontData, fontPath);

      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => resolve();
    };
  });
}

/**
 * Loads TTF font data from file path
 * @param fontPath - Relative path to the TTF font file
 * @returns Promise that resolves to font data
 */
async function loadTTF(fontPath: string): Promise<TTFLoaderResult> {
  return new Promise((resolve, reject) => {
    const ttfLoader = new TTFLoader();
    ttfLoader.load(fontPath, (data: object) => resolve(data as TTFLoaderResult), undefined, reject);
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
function applyMetricsCorrection(fontData: TTFLoaderResult): void {
  const bbox = fontData.boundingBox;

  if (bbox && typeof bbox === 'object' && 'yMax' in bbox && 'yMin' in bbox) {
    // Apply vertical offset correction
    // This compensates for the difference between JSON and TTF baseline calculations
    const verticalOffset = bbox.yMax * 0.5; // Adjust this value as needed

    bbox.yMin += verticalOffset;
    bbox.yMax += verticalOffset;
  }
}
