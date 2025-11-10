import { Product, MatchResult } from '@/types';
export declare class SmartMatcher {
    private readonly MIN_CONFIDENCE;
    private readonly MAX_RESULTS;
    private readonly WEIGHTS;
    private readonly CATEGORY_KEYWORDS;
    /**
     * Main matching method - uses smart weighted scoring
     */
    findMatches(sourceProduct: Product, candidates: Product[]): Promise<MatchResult[]>;
    /**
     * Preprocess candidates - validation and cleanup
     */
    private preprocessCandidates;
    /**
     * Detect product category using keywords and category field
     */
    private detectCategory;
    /**
     * Filter candidates by category (strict - no cross-category matches)
     */
    private filterByCategory;
    /**
     * Extract features from product for scoring
     */
    private extractFeatures;
    /**
     * Tokenize text (remove stop words, special chars)
     */
    private tokenize;
    /**
     * Generate n-grams from tokens
     */
    private generateNGrams;
    /**
     * Extract important keywords (brand names, model numbers, etc.)
     */
    private extractKeywords;
    /**
     * Calculate weighted score across all dimensions
     */
    private calculateScore;
    /**
     * Score brand match (0-25 points)
     */
    private scoreBrand;
    /**
     * Score model match (0-30 points)
     */
    private scoreModel;
    /**
     * Score specs match (storage, RAM, color) (0-20 points)
     */
    private scoreSpecs;
    /**
     * Score title similarity using token overlap and n-grams (0-15 points)
     */
    private scoreTitleSimilarity;
    /**
     * Calculate Jaccard similarity (token overlap)
     */
    private calculateTokenOverlap;
    /**
     * Score category match (0-10 points)
     */
    private scoreCategory;
    /**
     * Bonus points for price proximity (0-5 points)
     */
    private scorePriceProximity;
    /**
     * Calculate string similarity (Levenshtein-like)
     */
    private stringSimilarity;
    /**
     * Levenshtein distance (edit distance)
     */
    private levenshteinDistance;
    /**
     * Determine match level based on score
     */
    private getMatchLevel;
    /**
     * Get match badge based on score
     */
    private getMatchBadge;
    /**
     * Build match reason explanation
     */
    private buildMatchReason;
}
export declare const smartMatcher: SmartMatcher;
//# sourceMappingURL=smart-matcher.d.ts.map