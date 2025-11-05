/**
 * Logger Utility with levels and structured logging
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

class Logger {
  private level: LogLevel = LogLevel.INFO;
  private prefix: string;

  constructor(prefix: string = 'FineDeal') {
    this.prefix = prefix;
    // Set level from environment or storage
    this.initializeLogLevel();
  }

  private async initializeLogLevel() {
    try {
      if (chrome?.storage) {
        const result = await chrome.storage.local.get(['logLevel']);
        this.level = result.logLevel ?? LogLevel.INFO;
      }
    } catch {
      // Ignore errors in initialization
    }
  }

  setLevel(level: LogLevel) {
    this.level = level;
    try {
      if (chrome?.storage) {
        chrome.storage.local.set({ logLevel: level });
      }
    } catch {
      // Ignore errors
    }
  }

  debug(message: string, ...args: any[]) {
    if (this.level <= LogLevel.DEBUG) {
      console.log(`[${this.prefix}] 🐛 ${message}`, ...args);
    }
  }

  info(message: string, ...args: any[]) {
    if (this.level <= LogLevel.INFO) {
      console.info(`[${this.prefix}] ℹ️ ${message}`, ...args);
    }
  }

  warn(message: string, ...args: any[]) {
    if (this.level <= LogLevel.WARN) {
      console.warn(`[${this.prefix}] ⚠️ ${message}`, ...args);
    }
  }

  error(message: string, error?: any) {
    if (this.level <= LogLevel.ERROR) {
      console.error(`[${this.prefix}] ❌ ${message}`, error);
    }
  }

  group(label: string) {
    console.group(`[${this.prefix}] ${label}`);
  }

  groupEnd() {
    console.groupEnd();
  }

  time(label: string) {
    console.time(`[${this.prefix}] ${label}`);
  }

  timeEnd(label: string) {
    console.timeEnd(`[${this.prefix}] ${label}`);
  }
}

export const logger = new Logger('FineDeal');
export default logger;
