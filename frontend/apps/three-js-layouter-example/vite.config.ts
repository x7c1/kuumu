import { devLoggerPlugin, dualLoggerPlugin } from '@kuumu/dev-logger/vite';
import { defineConfig } from 'vite';
import { createBaseConfig } from '../vite-config-base';

const baseConfig = createBaseConfig({ port: 3001 });

export default defineConfig({
  ...baseConfig,
  plugins: [
    dualLoggerPlugin({
      include: ['three-js-layouter-example'],
    }),
    devLoggerPlugin({
      logFile: 'three-js-layouter-example.logs.json',
      endpoint: '/dev-logger/logs',
      maxLogEntries: 1000,
      resetOnReload: true,
    }),
  ],
});
