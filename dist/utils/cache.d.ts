/**
 * Smart Caching System - Cache product results for 5-10 minutes
 */
export declare class SmartCache {
    /**
     * Get cached data
     */
    get<T>(key: string): Promise<T | null>;
    /**
     * Set cached data
     */
    set<T>(key: string, data: T, ttl?: number): Promise<void>;
    /**
     * Delete cached data
     */
    delete(key: string): Promise<void>;
    /**
     * Clear all cached data
     */
    clear(): Promise<void>;
    /**
     * Clean expired entries
     */
    cleanExpired(): Promise<void>;
    /**
     * Generate cache key for product search
     */
    generateKey(site: string, query: string): string;
    /**
     * Simple string hash function
     */
    private hashString;
}
export declare const smartCache: SmartCache;
//# sourceMappingURL=cache.d.ts.map