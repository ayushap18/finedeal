import { ErrorCode, ExtensionError } from '@/types';
import logger from './logger';

/**
 * Custom error class for extension-specific errors
 */
export class FineDealError extends Error implements ExtensionError {
  code: ErrorCode;
  site?: string;
  details?: any;

  constructor(message: string, code: ErrorCode, site?: string, details?: any) {
    super(message);
    this.name = 'FineDealError';
    this.code = code;
    this.site = site;
    this.details = details;
  }
}

/**
 * Error handler with retry logic
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    delayMs?: number;
    exponentialBackoff?: boolean;
    onRetry?: (attempt: number, error: any) => void;
  } = {}
): Promise<T> {
  const { maxRetries = 3, delayMs = 1000, exponentialBackoff = true, onRetry } = options;

  let lastError: any;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries - 1) {
        const delay = exponentialBackoff ? delayMs * Math.pow(2, attempt) : delayMs;
        logger.warn(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`, error);
        onRetry?.(attempt + 1, error);
        await sleep(delay);
      }
    }
  }

  throw lastError;
}

/**
 * Timeout wrapper
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string = 'Operation timed out'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new FineDealError(errorMessage, ErrorCode.TIMEOUT)), timeoutMs)
    ),
  ]);
}

/**
 * Sleep utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Safe JSON parse
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  waitMs: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, waitMs);
  };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limitMs: number
): (...args: Parameters<T>) => void {
  let lastRan: number;
  return function executedFunction(...args: Parameters<T>) {
    if (!lastRan || Date.now() - lastRan >= limitMs) {
      func(...args);
      lastRan = Date.now();
    }
  };
}
