import { devLoggerPlugin, dualLoggerPlugin } from '@kuumu/dev-logger/vite';
import { defineConfig } from 'vite';
import { createBaseConfig } from '../vite-config-base';

const baseConfig = createBaseConfig({ port: 3002 });

export default defineConfig({
  ...baseConfig,
  plugins: [
    dualLoggerPlugin({
      include: ['frontend/libs/', 'frontend/apps/'],
    }),
    devLoggerPlugin({
      logFile: 'logs/graph-drawing-demo.log',
      endpoint: '/dev-logger/logs',
      maxLogEntries: 1000,
      resetOnReload: true,
    }),
  ],
  build: {
    ...baseConfig.build,
    chunkSizeWarningLimit: 500,
  },
});
