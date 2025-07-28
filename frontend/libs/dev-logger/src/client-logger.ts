import type { DevLoggerConfig, LogEntry } from './types';

export class DevLogger {
  private static instance: DevLogger | null = null;
  private config: Required<DevLoggerConfig>;
  private sessionId: string;

  private constructor(config: DevLoggerConfig = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      source: config.source ?? 'unknown',
      endpoint: config.endpoint ?? '/dev-logger/logs',
    };

    // Generate unique session ID for this browser session
    this.sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  static getInstance(config?: DevLoggerConfig): DevLogger {
    if (!DevLogger.instance) {
      DevLogger.instance = new DevLogger(config);
    } else if (config) {
      // Update existing instance config if new config is provided
      DevLogger.instance.updateConfig(config);
    }
    return DevLogger.instance;
  }

  static initialize(config?: DevLoggerConfig): DevLogger {
    return DevLogger.getInstance(config);
  }

  private updateConfig(config: DevLoggerConfig): void {
    if (config.enabled !== undefined) {
      this.config.enabled = config.enabled;
    }
    if (config.source !== undefined) {
      this.config.source = config.source;
    }
    if (config.endpoint !== undefined) {
      this.config.endpoint = config.endpoint;
    }
  }

  log(source: string, ...args: unknown[]): void {
    if (this.config.enabled) {
      this.sendLog('log', this.formatMessage(args), this.extractData(args), source);
    }
  }

  warn(source: string, ...args: unknown[]): void {
    if (this.config.enabled) {
      this.sendLog('warn', this.formatMessage(args), this.extractData(args), source);
    }
  }

  error(source: string, ...args: unknown[]): void {
    if (this.config.enabled) {
      this.sendLog('error', this.formatMessage(args), this.extractData(args), source);
    }
  }

  info(source: string, ...args: unknown[]): void {
    if (this.config.enabled) {
      this.sendLog('info', this.formatMessage(args), this.extractData(args), source);
    }
  }

  debug(source: string, ...args: unknown[]): void {
    if (this.config.enabled) {
      this.sendLog('debug', this.formatMessage(args), this.extractData(args), source);
    }
  }

  private formatMessage(args: unknown[]): string {
    return args.map((arg) => (typeof arg === 'string' ? arg : JSON.stringify(arg))).join(' ');
  }

  private extractData(args: unknown[]): unknown {
    if (args.length === 1) return args[0];
    if (args.length > 1) return args;
    return undefined;
  }

  private async sendLog(
    level: LogEntry['level'],
    message: string,
    data?: unknown,
    source?: string
  ): Promise<void> {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      source: source || this.config.source,
    };

    try {
      await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: this.sessionId,
          logEntry: logEntry,
        }),
      });
    } catch (err) {
      // Silently fail to avoid infinite loops
    }
  }

  enable(): void {
    this.config.enabled = true;
  }

  disable(): void {
    this.config.enabled = false;
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }
}
