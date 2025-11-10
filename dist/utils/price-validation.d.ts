/**
 * Price Validation Utilities
 * Detect suspicious prices and flag anomalies
 */
export interface PriceValidation {
    isValid: boolean;
    isSuspicious: boolean;
    reason?: string;
    confidence: number;
}
/**
 * Validate if a price is reasonable compared to the original
 */
export declare function validatePrice(originalPrice: number, comparedPrice: number, tolerance?: {
    low: number;
    high: number;
}): PriceValidation;
/**
 * Check if price looks like a placeholder or error
 */
export declare function isPricePlaceholder(price: number): boolean;
/**
 * Validate price format and reasonableness
 */
export declare function isReasonablePrice(price: number, category?: string): boolean;
/**
 * Calculate price confidence score
 * Higher score = more confident the price is correct
 */
export declare function calculatePriceConfidence(originalPrice: number, comparedPrice: number): number;
//# sourceMappingURL=price-validation.d.ts.map