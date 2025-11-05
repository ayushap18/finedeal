/**
 * Price Validation Utilities
 * Detect suspicious prices and flag anomalies
 */

export interface PriceValidation {
  isValid: boolean;
  isSuspicious: boolean;
  reason?: string;
  confidence: number; // 0-1, where 1 is most confident
}

/**
 * Validate if a price is reasonable compared to the original
 */
export function validatePrice(
  originalPrice: number,
  comparedPrice: number,
  tolerance: { low: number; high: number } = { low: 0.3, high: 2.0 }
): PriceValidation {
  // Basic validation
  if (comparedPrice <= 0) {
    return {
      isValid: false,
      isSuspicious: true,
      reason: 'Invalid price (zero or negative)',
      confidence: 0
    };
  }

  if (originalPrice <= 0) {
    return {
      isValid: true,
      isSuspicious: false,
      confidence: 0.5 // Can't validate without original
    };
  }

  const ratio = comparedPrice / originalPrice;

  // Too cheap (< 30% of original) - likely error or scam
  if (ratio < tolerance.low) {
    return {
      isValid: true,
      isSuspicious: true,
      reason: `Suspiciously cheap (${Math.round(ratio * 100)}% of original price)`,
      confidence: 0.3
    };
  }

  // Too expensive (> 200% of original) - likely wrong product
  if (ratio > tolerance.high) {
    return {
      isValid: true,
      isSuspicious: true,
      reason: `Suspiciously expensive (${Math.round(ratio * 100)}% of original price)`,
      confidence: 0.4
    };
  }

  // Price is within reasonable range
  // Give higher confidence to prices closer to original
  const deviation = Math.abs(ratio - 1);
  const confidence = Math.max(0.5, 1 - deviation);

  return {
    isValid: true,
    isSuspicious: false,
    confidence
  };
}

/**
 * Check if price looks like a placeholder or error
 */
export function isPricePlaceholder(price: number): boolean {
  // Common placeholder values
  const placeholders = [1, 99, 999, 9999, 99999, 100, 1000, 10000];
  
  return placeholders.includes(price);
}

/**
 * Validate price format and reasonableness
 */
export function isReasonablePrice(price: number, category?: string): boolean {
  // Too low to be real
  if (price < 10) return false;

  // Unreasonably high (adjust based on category)
  const maxPrices: Record<string, number> = {
    fashion: 50000,
    electronics: 500000,
    beauty: 20000,
    home: 200000,
    default: 1000000
  };

  const maxPrice = category ? maxPrices[category] || maxPrices.default : maxPrices.default;
  
  if (price > maxPrice) return false;

  return true;
}

/**
 * Calculate price confidence score
 * Higher score = more confident the price is correct
 */
export function calculatePriceConfidence(
  originalPrice: number,
  comparedPrice: number
): number {
  const validation = validatePrice(originalPrice, comparedPrice);
  
  if (!validation.isValid) return 0;
  if (validation.isSuspicious) return validation.confidence;
  
  // Boost confidence for prices within 10% of original
  const ratio = comparedPrice / originalPrice;
  if (ratio >= 0.9 && ratio <= 1.1) {
    return Math.min(1, validation.confidence + 0.2);
  }

  return validation.confidence;
}
