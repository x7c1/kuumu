import { devLoggerPlugin, dualLoggerPlugin } from '@kuumu/dev-logger/vite';
import { defineConfig } from 'vite';
import { createBaseConfig } from '../vite-config-base';

const baseConfig = createBaseConfig({ port: 3001 });

export default defineConfig({
  ...baseConfig,
  plugins: [
    dualLoggerPlugin({
      include: ['frontend/libs/', 'frontend/apps/'],
    }),
    devLoggerPlugin({
      logFile: 'three-js-layouter-example.log',
      endpoint: '/dev-logger/logs',
      maxLogEntries: 1000,
      resetOnReload: true,
    }),
  ],
  build: {
    ...baseConfig.build,
    // Three.js library is ~508KB after minification, so set warning limit above that
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three/')) {
            return 'three';
          }
        },
      },
    },
  },
  // Ensure TTF files are treated as assets and copied to output directory
  assetsInclude: ['**/*.ttf', '**/*.otf', '**/*.woff', '**/*.woff2'],
});
