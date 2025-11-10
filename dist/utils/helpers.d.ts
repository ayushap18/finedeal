import { ErrorCode, ExtensionError } from '@/types';
/**
 * Custom error class for extension-specific errors
 */
export declare class FineDealError extends Error implements ExtensionError {
    code: ErrorCode;
    site?: string;
    details?: any;
    constructor(message: string, code: ErrorCode, site?: string, details?: any);
}
/**
 * Error handler with retry logic
 */
export declare function withRetry<T>(fn: () => Promise<T>, options?: {
    maxRetries?: number;
    delayMs?: number;
    exponentialBackoff?: boolean;
    onRetry?: (attempt: number, error: any) => void;
}): Promise<T>;
/**
 * Timeout wrapper
 */
export declare function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage?: string): Promise<T>;
/**
 * Sleep utility
 */
export declare function sleep(ms: number): Promise<void>;
/**
 * Safe JSON parse
 */
export declare function safeJsonParse<T>(json: string, fallback: T): T;
/**
 * Debounce function
 */
export declare function debounce<T extends (...args: any[]) => any>(func: T, waitMs: number): (...args: Parameters<T>) => void;
/**
 * Throttle function
 */
export declare function throttle<T extends (...args: any[]) => any>(func: T, limitMs: number): (...args: Parameters<T>) => void;
//# sourceMappingURL=helpers.d.ts.map