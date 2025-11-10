import { PerformanceMetrics } from '@/types';
/**
 * Track analytics event
 */
declare function trackEvent(event: string, data?: Record<string, any>): void;
/**
 * Check rate limit
 */
declare function checkRateLimit(site: string, limitPerMinute?: number): boolean;
/**
 * Performance monitoring
 */
declare function logPerformanceMetrics(metrics: PerformanceMetrics): void;
export { trackEvent, checkRateLimit, logPerformanceMetrics };
//# sourceMappingURL=service-worker.d.ts.map