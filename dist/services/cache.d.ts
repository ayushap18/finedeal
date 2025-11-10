/**
 * LRU Cache implementation for extension
 */
export declare class Cache<T> {
    private cache;
    private maxSize;
    private defaultTTL;
    constructor(maxSize?: number, defaultTTL?: number);
    /**
     * Get item from cache
     */
    get(key: string): T | null;
    /**
     * Set item in cache
     */
    set(key: string, data: T, ttl?: number): void;
    /**
     * Check if key exists and is valid
     */
    has(key: string): boolean;
    /**
     * Clear cache
     */
    clear(): void;
    /**
     * Get cache size
     */
    size(): number;
    /**
     * Remove specific key
     */
    delete(key: string): boolean;
}
export declare const cache: Cache<unknown>;
//# sourceMappingURL=cache.d.ts.map