import fs from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';

interface DualLoggerOptions {
  include?: string[]; // Target packages/paths for transformation
}

// Dual logger plugin - adds logger calls alongside console calls in development
export const dualLoggerPlugin = (options?: DualLoggerOptions): Plugin => {
  const includePatterns = options?.include || [];

  // Find monorepo root by looking for workspace root
  const findMonorepoRoot = (startPath: string): string => {
    let currentPath = startPath;
    while (currentPath !== path.dirname(currentPath)) {
      const packageJsonPath = path.join(currentPath, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        if (packageJson.workspaces) {
          return currentPath;
        }
      }
      currentPath = path.dirname(currentPath);
    }
    return startPath; // fallback to original path
  };

  return {
    name: 'dual-logger',
    resolveId(id, importer) {
      // Handle virtual logger module
      if (
        id === './logger' &&
        importer &&
        includePatterns.some((pattern) => importer.includes(pattern))
      ) {
        return 'virtual:logger';
      }
      return null;
    },
    load(id) {
      if (id === 'virtual:logger') {
        return `import { DevLogger } from '@kuumu/dev-logger';
export const logger = DevLogger.getInstance();`;
      }
      return null;
    },
    transform(code, id) {
      // Only transform in development and skip node_modules
      if (process.env.NODE_ENV !== 'development' || id.includes('node_modules')) {
        return null;
      }

      // Only transform files matching include patterns if specified
      if (includePatterns.length > 0) {
        const isIncluded = includePatterns.some((pattern) => id.includes(pattern));
        if (!isIncluded) {
          return null;
        }
      }

      // Quick check if file contains console calls
      if (!code.includes('console.')) {
        return null;
      }

      let needsLoggerImport = false;
      let transformedCode = code;

      const hasLoggerImportPattern = /import.*\{[^}]*logger[^}]*\}.*from.*['"]\.\/logger['"]/.test(
        code
      );

      // Transform console calls to dual calls
      transformedCode = transformedCode.replace(
        /console\.(log|error|warn|info|debug)\(([^;]*?)\);/g,
        (_, method, args) => {
          needsLoggerImport = true;
          // Find monorepo root and convert to relative path
          const monorepoRoot = findMonorepoRoot(process.cwd());
          const relativePath = id.startsWith(monorepoRoot)
            ? id.substring(monorepoRoot.length + 1)
            : id;
          return `console.${method}(${args}); logger?.${method}('${relativePath}', ${args});`;
        }
      );

      // Add logger import if needed and not already present
      if (needsLoggerImport && !hasLoggerImportPattern) {
        // Find the first import statement to insert after it
        const firstImportMatch = transformedCode.match(/^import[^;]+;/m);
        if (firstImportMatch) {
          const insertPos = firstImportMatch.index! + firstImportMatch[0].length;
          transformedCode =
            transformedCode.slice(0, insertPos) +
            `\nimport { logger } from './logger';` +
            transformedCode.slice(insertPos);
        } else {
          // If no imports found, add at the beginning
          transformedCode = `import { logger } from './logger';\n` + transformedCode;
        }
      }

      // Return null if no changes were made
      return transformedCode === code ? null : transformedCode;
    },
  };
};
