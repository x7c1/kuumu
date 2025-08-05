import { loadFont as loadFontFromFactory } from '@kuumu/three-js-layouter/group-factory';
import type { Font } from 'three/examples/jsm/loaders/FontLoader.js';

let cachedFont: Font | null = null;

export async function loadFont(): Promise<Font | null> {
  if (!cachedFont) {
    cachedFont = await loadFontFromFactory('./fonts/PlemolJP_Regular.json');
    if (!cachedFont) {
      console.error('Failed to load font');
    }
  }
  return cachedFont;
}
