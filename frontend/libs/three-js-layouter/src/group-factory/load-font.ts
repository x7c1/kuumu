import type { Font } from 'three/examples/jsm/loaders/FontLoader.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';

// WebGL-based text rendering
let fontCache: Font | null = null;

export async function loadFont(): Promise<Font | null> {
  if (fontCache) return fontCache;

  return new Promise((resolve) => {
    const fontLoader = new FontLoader();
    const fontUrl = './fonts/PlemolJP_Regular.json';

    fontLoader.load(
      fontUrl,
      (font) => {
        fontCache = font;
        console.log(`✓ Font loaded: ${fontUrl}`);
        resolve(font);
      },
      undefined,
      (error) => {
        console.warn(`⚠️ Font loading failed: ${fontUrl}`, error);
        resolve(null);
      }
    );
  });
}
