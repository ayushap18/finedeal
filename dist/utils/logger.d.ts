/**
 * Logger Utility with levels and structured logging
 */
export declare enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3
}
declare class Logger {
    private level;
    private prefix;
    constructor(prefix?: string);
    private initializeLogLevel;
    setLevel(level: LogLevel): void;
    debug(message: string, ...args: any[]): void;
    info(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    error(message: string, error?: any): void;
    group(label: string): void;
    groupEnd(): void;
    time(label: string): void;
    timeEnd(label: string): void;
}
export declare const logger: Logger;
export default logger;
//# sourceMappingURL=logger.d.ts.map