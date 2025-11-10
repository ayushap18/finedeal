/**
 * Advanced Product Number/SKU Extraction System
 * Extracts model numbers, SKUs, part numbers, ASINs, and other product identifiers
 */
export interface ProductNumberInfo {
    productNumber: string;
    modelNumber: string;
    partNumber: string;
    sku: string;
    asin: string;
    confidence: number;
    source: 'title' | 'attribute' | 'url';
}
/**
 * Extract all product numbers/identifiers from title
 */
export declare function extractProductNumbers(title: string, productId?: string, url?: string): ProductNumberInfo;
/**
 * Compare two product numbers for matching
 */
export declare function productNumbersMatch(num1: ProductNumberInfo, num2: ProductNumberInfo): boolean;
/**
 * Generate search query focused on product number
 */
export declare function generateProductNumberQuery(productInfo: ProductNumberInfo, brand?: string): string;
/**
 * Check if title contains product number indicators
 */
export declare function hasProductNumber(title: string): boolean;
/**
 * Extract product number from URL patterns
 */
export declare function extractProductNumberFromUrl(url: string): string;
//# sourceMappingURL=product-number-extractor.d.ts.map