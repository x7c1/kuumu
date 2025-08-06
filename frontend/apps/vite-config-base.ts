import { createLibsAliases } from '../libs/create-libs-aliases';

interface AppConfig {
  port: number;
}

export function createBaseConfig({ port }: AppConfig) {
  return {
    root: './',
    build: {
      outDir: 'dist',
      target: 'es2022',
      sourcemap: true,
    },
    resolve: {
      alias: createLibsAliases(),
    },
    server: {
      port,
      strictPort: true,
      open: true,
      watch: {
        ignored: ['!**/libs/**/*.{ts,json}'],
      },
    },
    optimizeDeps: {
      exclude: ['@kuumu/*'],
      include: ['three'],
    },
  };
}
