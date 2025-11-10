import { Product, MatchResult } from '@/types';
/**
 * Production-level Product Matching Engine
 * Uses multiple algorithms: exact matching, fuzzy matching, ML-inspired scoring
 */
export declare class ProductMatcher {
    private readonly MIN_CONFIDENCE;
    private readonly ACCESSORY_KEYWORDS;
    /**
     * Find matching products with confidence scoring (OPTIMIZED)
     */
    findMatches(sourceProduct: Product, candidates: Product[]): Promise<MatchResult[]>;
    /**
     * Level 0.5: Product Number/SKU matching (NEW!)
     */
    private findProductNumberMatches;
    /**
     * Level 1: Exact Product ID matching
     */
    private findExactIdMatches;
    /**
     * Level 2: Brand + Model + Storage matching
     */
    private findBrandModelStorageMatches;
    /**
     * Level 3: Brand + Model matching (without storage)
     */
    private findBrandModelMatches;
    /**
     * Level 4: Fuzzy matching with brand validation
     */
    private findFuzzyMatches;
    /**
     * Filter out accessories unless source is an accessory
     */
    private filterAccessories;
    /**
     * Check if product is an accessory
     */
    private isAccessory;
    /**
     * Extract all attributes from product
     */
    private extractAttributes;
    /**
     * Compare brands (with normalization and alias support)
     */
    private compareBrands;
    /**
     * Compare models (handles variations like "15 Pro" vs "15Pro")
     */
    private compareModels;
    /**
     * Calculate text similarity using Jaccard similarity
     */
    private calculateTextSimilarity;
    /**
     * Tokenize text (remove stop words)
     */
    private tokenize;
    /**
     * Check if two titles share common important keywords
     */
    private hasCommonKeywords;
    /**
     * Sort matches by confidence and limit results
     */
    private sortAndLimit;
    /**
     * Find similar products when exact matches fail
     * Matches by: Brand + Category, Brand + Color, Brand + Shade (beauty products)
     */
    findSimilarProducts(sourceProduct: Product, candidates: Product[]): Promise<MatchResult[]>;
}
export declare const productMatcher: ProductMatcher;
//# sourceMappingURL=matcher.d.ts.map