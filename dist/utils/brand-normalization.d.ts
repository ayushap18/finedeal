/**
 * Brand Normalization Utilities
 * Handle brand name variations and aliases
 */
/**
 * Brand aliases map - handles common variations
 */
export declare const BRAND_ALIASES: Record<string, string[]>;
/**
 * Normalize brand name to canonical form
 */
export declare function normalizeBrand(brand: string): string;
/**
 * Check if two brands are the same (considering aliases)
 */
export declare function brandsMatch(brand1: string, brand2: string): boolean;
/**
 * Extract brand from title with normalization
 */
export declare function extractAndNormalizeBrand(title: string): string;
/**
 * Get all brand variations for matching
 */
export declare function getBrandVariations(brand: string): string[];
//# sourceMappingURL=brand-normalization.d.ts.map