export interface LogEntry {
  timestamp: string;
  level: 'log' | 'warn' | 'error' | 'info' | 'debug';
  message: string;
  data?: unknown;
  source: string;
}

export interface DevLoggerConfig {
  enabled?: boolean;
  source?: string;
  endpoint?: string;
}
