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
    logFile = 'dev-console.log',
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
        const content = fs.readFileSync(logFilePath, 'utf-8').trim();
        if (content) {
          // Parse NDJSON format (each line is a separate JSON object)
          logs = content.split('\n').map((line) => JSON.parse(line));
        } else {
          logs = [];
        }
      } else {
        logs = [];
      }
    } catch (err) {
      console.warn('Failed to load existing logs:', err);
      logs = [];
    }
  };

  // Append a single log entry to file (NDJSON format)
  const appendLog = (logEntry: LogEntry) => {
    try {
      const logLine = JSON.stringify(logEntry) + '\n';
      fs.appendFileSync(logFilePath, logLine);
    } catch (err) {
      console.warn('Failed to append log:', err);
    }
  };

  // Rewrite entire log file (used for session resets or cleanup)
  const rewriteLogs = () => {
    try {
      // Keep only the most recent entries
      if (logs.length > maxLogEntries) {
        logs = logs.slice(-maxLogEntries);
      }

      // Write each log entry as a separate JSON line (NDJSON format)
      const ndjsonContent = logs.map((log) => JSON.stringify(log)).join('\n');
      fs.writeFileSync(logFilePath, ndjsonContent + (logs.length > 0 ? '\n' : ''));
    } catch (err) {
      console.warn('Failed to rewrite logs:', err);
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
                // Clear the file for new session
                fs.writeFileSync(logFilePath, '');
              }

              // Add log entry
              if (data.logEntry) {
                logs.push(data.logEntry);
                // Append only the new log entry
                appendLog(data.logEntry);

                // Periodically clean up if we exceed max entries
                if (logs.length > maxLogEntries) {
                  logs = logs.slice(-maxLogEntries);
                  rewriteLogs();
                }
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
