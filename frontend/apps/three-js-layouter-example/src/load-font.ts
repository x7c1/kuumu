import { loadFont as loadFontFromFactory } from '@kuumu/three-js-layouter/group-factory';
import type { Font } from 'three/examples/jsm/loaders/FontLoader.js';

let cachedFont: Font | null = null;

export async function loadFont(): Promise<Font | null> {
  if (!cachedFont) {
    const fontPath = import.meta.env.VITE_KUUMU_FONT_PATH;
    console.log(`Loading font ${fontPath}`);

    if (!fontPath) {
      throw new Error('VITE_KUUMU_FONT_PATH was not set during build time. Please set it in your .envrc file and rebuild the application.');
    }

    cachedFont = await loadFontFromFactory(fontPath);
    if (!cachedFont) {
      console.error('Failed to load font');
    }
  }
  return cachedFont;
}
