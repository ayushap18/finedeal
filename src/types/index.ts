/**
 * Product Types
 */
export interface Product {
  site: string;
  title: string;
  price: string;
  numericPrice: number;
  url: string;
  image: string;
  productId: string;
  brand: string;
  category: string;
  attributes?: ProductAttributes;
  productNumber?: string; // SKU, model number, or part number
  sku?: string; // Specific SKU code
  availability?: 'in-stock' | 'out-of-stock' | 'limited-stock' | 'unknown';
}

export interface ProductAttributes {
  model?: string;
  storage?: string;
  ram?: string;
  color?: string;
  size?: string;
  variant?: string;
  brand?: string;
}

/**
 * Match Result Types
 */
export interface MatchResult extends Product {
  confidence: number;
  matchLevel: MatchLevel;
  matchBadge: string;
  matchReason: string;
  similarity?: number;
}

export enum MatchLevel {
  EXACT_ID = 'EXACT_ID',
  EXACT = 'EXACT',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  SIMILAR = 'SIMILAR', // For similar products when exact match fails
}

/**
 * Site Configuration
 */
export interface SiteConfig {
  name: string;
  badge: string;
  searchUrl: string;
  selectors: SiteSelectors;
  enabled: boolean;
  priority: number;
}

export interface SiteSelectors {
  productPage: {
    title: string[];
    price: string[];
    image: string[];
    productId: string[];
    brand?: string[];
  };
  searchPage: {
    container: string[];
    title: string[];
    price: string[];
    image: string[];
    link: string[];
    productId?: string[];
  };
}

/**
 * Scraping Results
 */
export interface ScrapedProduct extends Omit<Product, 'numericPrice'> {
  numericPrice?: number;
}

export interface ScrapeResult {
  site: string;
  products: ScrapedProduct[];
  error?: string;
  timestamp: number;
}

/**
 * Comparison Results
 */
export interface ComparisonResult {
  originalProduct: Product;
  matches: MatchResult[];
  sitesSearched: number;
  totalProducts: number;
  bestPrice?: MatchResult;
  savings?: number;
  savingsPercent?: number;
  timestamp: number;
}

/**
 * Cache Types
 */
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

/**
 * Analytics Types
 */
export interface AnalyticsEvent {
  event: string;
  timestamp: number;
  data?: Record<string, any>;
}

export interface PerformanceMetrics {
  totalTime: number;
  scrapeTime: number;
  matchTime: number;
  sitesSearched: number;
  productsFound: number;
  matchesFound: number;
}

/**
 * Error Types
 */
export enum ErrorCode {
  NETWORK_ERROR = 'NETWORK_ERROR',
  SCRAPE_ERROR = 'SCRAPE_ERROR',
  MATCH_ERROR = 'MATCH_ERROR',
  INVALID_PRODUCT = 'INVALID_PRODUCT',
  TIMEOUT = 'TIMEOUT',
  RATE_LIMIT = 'RATE_LIMIT',
}

export interface ExtensionError extends Error {
  code: ErrorCode;
  site?: string;
  details?: any;
}

/**
 * Message Types for Chrome Extension Communication
 */
export type MessageType =
  | 'GET_PRODUCT_INFO'
  | 'GET_SEARCH_RESULTS'
  | 'WAIT_FOR_PAGE_READY'
  | 'START_COMPARISON'
  | 'UPDATE_PROGRESS'
  | 'COMPARISON_COMPLETE'
  | 'ERROR'
  | 'SHOW_PRICE_DROP_NOTIFICATION';

export interface ChromeMessage<T = any> {
  type: MessageType;
  data?: T;
}

export interface ProgressUpdate {
  site: string;
  status: 'pending' | 'searching' | 'scraping' | 'matching' | 'complete' | 'error';
  productsFound?: number;
  matchesFound?: number;
  error?: string;
}
