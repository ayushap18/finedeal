/**
 * Parse price string to number
 */
export declare function parsePrice(priceText: string): number;
/**
 * Format price to display string
 */
export declare function formatPrice(price: number, currency?: string): string;
/**
 * Calculate price difference
 */
export declare function calculatePriceDiff(original: number, compare: number): {
    diff: number;
    percent: number;
    isCheaper: boolean;
};
/**
 * Extract brand from title
 */
export declare function extractBrand(title: string): string;
/**
 * Extract model from title (includes brand+model for better matching)
 */
export declare function extractModel(title: string): string;
/**
 * Extract storage/capacity
 */
export declare function extractStorage(title: string): string;
/**
 * Extract RAM
 */
export declare function extractRAM(title: string): string;
/**
 * Extract color
 */
export declare function extractColor(title: string): string;
/**
 * Detect product category
 */
export declare function detectCategory(title: string): string;
/**
 * Generate multiple search queries with fallback strategies (Google Shopping style)
 * NOW WITH PRODUCT NUMBER PRIORITY!
 */
export declare function generateSearchQueries(title: string, brand?: string, productNumber?: string, productId?: string, url?: string): string[];
/**
 * Generate search query from product title (uses best strategy)
 */
export declare function generateSearchQuery(title: string, brand?: string): string;
/**
 * OLD VERSION - kept for compatibility
 * Generate search query from product title
 */
export declare function generateSearchQueryLegacy(title: string, brand?: string): string;
//# sourceMappingURL=product.d.ts.map