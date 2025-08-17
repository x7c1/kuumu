import { devLoggerPlugin, dualLoggerPlugin } from '@kuumu/dev-logger/vite';
import { defineConfig } from 'vite';
import { createBaseConfig } from '../vite-config-base';
import fs from 'fs';
import path from 'path';

const baseConfig = createBaseConfig({ port: 3002 });

// Plugin to handle graph data saving/loading
const graphDataPlugin = () => {
  const dataDir = path.resolve(process.cwd(), 'graph-data');

  // Ensure directory exists
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  return {
    name: 'graph-data',
    configureServer(server) {
      // Save graph endpoint
      server.middlewares.use('/api/save-graph', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('Method Not Allowed');
          return;
        }

        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });

        req.on('end', () => {
          try {
            const data = JSON.parse(body);
            const { filename, content } = data;

            if (!filename || !content) {
              res.statusCode = 400;
              res.end('Missing filename or content');
              return;
            }

            const filePath = path.join(dataDir, filename);
            fs.writeFileSync(filePath, content);

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, filename }));
          } catch (error) {
            res.statusCode = 500;
            res.end(`Error saving file: ${error.message}`);
          }
        });
      });

      // List graphs endpoint
      server.middlewares.use('/api/list-graphs', (req, res) => {
        if (req.method !== 'GET') {
          res.statusCode = 405;
          res.end('Method Not Allowed');
          return;
        }

        try {
          const files = fs.readdirSync(dataDir)
            .filter(file => file.endsWith('.json'))
            .map(file => {
              const filePath = path.join(dataDir, file);
              const stats = fs.statSync(filePath);
              return {
                name: file,
                modified: stats.mtime.toISOString(),
                size: stats.size
              };
            })
            .sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime());

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(files));
        } catch (error) {
          res.statusCode = 500;
          res.end(`Error listing files: ${error.message}`);
        }
      });

      // Load graph endpoint
      server.middlewares.use('/api/load-graph', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('Method Not Allowed');
          return;
        }

        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });

        req.on('end', () => {
          try {
            const { filename } = JSON.parse(body);

            if (!filename) {
              res.statusCode = 400;
              res.end('Missing filename');
              return;
            }

            const filePath = path.join(dataDir, filename);

            if (!fs.existsSync(filePath)) {
              res.statusCode = 404;
              res.end('File not found');
              return;
            }

            const content = fs.readFileSync(filePath, 'utf8');

            res.setHeader('Content-Type', 'application/json');
            res.end(content);
          } catch (error) {
            res.statusCode = 500;
            res.end(`Error loading file: ${error.message}`);
          }
        });
      });

      // Delete graph endpoint
      server.middlewares.use('/api/delete-graph', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('Method Not Allowed');
          return;
        }

        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });

        req.on('end', () => {
          try {
            const { filename } = JSON.parse(body);

            if (!filename) {
              res.statusCode = 400;
              res.end('Missing filename');
              return;
            }

            const filePath = path.join(dataDir, filename);

            if (!fs.existsSync(filePath)) {
              res.statusCode = 404;
              res.end('File not found');
              return;
            }

            fs.unlinkSync(filePath);

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true }));
          } catch (error) {
            res.statusCode = 500;
            res.end(`Error deleting file: ${error.message}`);
          }
        });
      });
    }
  };
};

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
    graphDataPlugin(),
  ],
  build: {
    ...baseConfig.build,
    chunkSizeWarningLimit: 500,
  },
});
