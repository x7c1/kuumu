import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Creates Vite aliases for all packages in the libs directory
 *
 * @returns Object mapping package names to their source directories
 * @example
 * Returns:
 * {
 *   '@kuumu/layouter': '/path/to/packages/libs/layouter/src',
 *   '@kuumu/three-js-layouter': '/path/to/packages/libs/three-js-layouter/src'
 * }
 */
export function createLibsAliases(): Record<string, string> {
  const libsDir = __dirname;
  const libFolders = readdirSync(libsDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  return libFolders.reduce(
    (acc, folderName) => {
      acc[`@kuumu/${folderName}`] = resolve(libsDir, folderName, 'src');
      return acc;
    },
    {} as Record<string, string>
  );
}
