/**
 * Smart Caching System - Cache product results for 5-10 minutes
 */

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 100; // Maximum cached items

export class SmartCache {
  /**
   * Get cached data
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const result = await chrome.storage.local.get(key);
      const entry: CacheEntry | undefined = result[key];
      
      if (!entry) {
        return null;
      }
      
      // Check if expired
      if (Date.now() - entry.timestamp > entry.ttl) {
        await this.delete(key);
        return null;
      }
      
      return entry.data as T;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }
  
  /**
   * Set cached data
   */
  async set<T>(key: string, data: T, ttl: number = DEFAULT_TTL): Promise<void> {
    try {
      // Clean old entries before adding new one
      await this.cleanExpired();
      
      const entry: CacheEntry = {
        data,
        timestamp: Date.now(),
        ttl
      };
      
      await chrome.storage.local.set({ [key]: entry });
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }
  
  /**
   * Delete cached data
   */
  async delete(key: string): Promise<void> {
    try {
      await chrome.storage.local.remove(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }
  
  /**
   * Clear all cached data
   */
  async clear(): Promise<void> {
    try {
      await chrome.storage.local.clear();
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }
  
  /**
   * Clean expired entries
   */
  async cleanExpired(): Promise<void> {
    try {
      const all = await chrome.storage.local.get(null);
      const keysToDelete: string[] = [];
      const now = Date.now();
      
      for (const key in all) {
        const entry = all[key] as CacheEntry;
        if (entry.timestamp && now - entry.timestamp > entry.ttl) {
          keysToDelete.push(key);
        }
      }
      
      if (keysToDelete.length > 0) {
        await chrome.storage.local.remove(keysToDelete);
        console.log(`Cleaned ${keysToDelete.length} expired cache entries`);
      }
      
      // If still too many, remove oldest
      const remaining = Object.keys(all).length - keysToDelete.length;
      if (remaining > MAX_CACHE_SIZE) {
        const sortedKeys = Object.keys(all)
          .filter(k => !keysToDelete.includes(k))
          .sort((a, b) => (all[a] as CacheEntry).timestamp - (all[b] as CacheEntry).timestamp);
        
        const toRemove = sortedKeys.slice(0, remaining - MAX_CACHE_SIZE);
        await chrome.storage.local.remove(toRemove);
        console.log(`Removed ${toRemove.length} oldest cache entries`);
      }
    } catch (error) {
      console.error('Cache clean error:', error);
    }
  }
  
  /**
   * Generate cache key for product search
   */
  generateKey(site: string, query: string): string {
    return `cache:${site}:${this.hashString(query)}`;
  }
  
  /**
   * Simple string hash function
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
}

export const smartCache = new SmartCache();
