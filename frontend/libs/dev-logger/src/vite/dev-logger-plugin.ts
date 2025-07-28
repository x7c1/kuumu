import * as fs from 'node:fs';
import * as path from 'node:path';
import type { Plugin } from 'vite';
import type { LogEntry } from '../types';

export interface DevLoggerPluginOptions {
  logFile?: string;
  endpoint?: string;
  maxLogEntries?: number;
  resetOnReload?: boolean;
}

export function devLoggerPlugin(options: DevLoggerPluginOptions = {}): Plugin {
  const {
    logFile = 'dev-logs.json',
    endpoint = '/dev-logger/logs',
    maxLogEntries = 1000,
    resetOnReload = true,
  } = options;

  const logFilePath = path.resolve(process.cwd(), logFile);
  let logs: LogEntry[] = [];
  let currentSessionId: string | null = null;

  // Load existing logs if file exists
  const loadLogs = () => {
    try {
      if (!resetOnReload && fs.existsSync(logFilePath)) {
        const content = fs.readFileSync(logFilePath, 'utf-8');
        logs = JSON.parse(content);
      } else {
        logs = [];
      }
    } catch (err) {
      console.warn('Failed to load existing logs:', err);
      logs = [];
    }
  };

  // Save logs to file
  const saveLogs = () => {
    try {
      // Keep only the most recent entries
      if (logs.length > maxLogEntries) {
        logs = logs.slice(-maxLogEntries);
      }

      fs.writeFileSync(logFilePath, JSON.stringify(logs, null, 2));
    } catch (err) {
      console.warn('Failed to save logs:', err);
    }
  };

  return {
    name: 'dev-logger',
    configureServer(server) {
      loadLogs();

      // Handle log submissions
      server.middlewares.use(endpoint, (req, res, next) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk.toString();
          });

          req.on('end', () => {
            try {
              const data = JSON.parse(body);

              // Check for session ID to detect new browser sessions
              if (resetOnReload && data.sessionId && data.sessionId !== currentSessionId) {
                logs = [];
                currentSessionId = data.sessionId;
                saveLogs();
              }

              // Add log entry
              if (data.logEntry) {
                logs.push(data.logEntry);
                saveLogs();
              }

              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true, currentSessionId }));
            } catch (_error) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
          });
        } else if (req.method === 'GET') {
          // Serve logs for inspection
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(logs));
        } else {
          next();
        }
      });

      console.log(`Dev Logger: Logs will be saved to ${logFilePath}`);
      console.log(
        `Dev Logger: Access logs at http://localhost:${server.config.server.port || 5173}${endpoint}`
      );
    },
  };
}
