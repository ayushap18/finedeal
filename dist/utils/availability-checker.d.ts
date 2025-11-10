/**
 * Product Availability Detection System
 * Detects if a product is in stock, out of stock, or unavailable
 */
export type AvailabilityStatus = 'in-stock' | 'out-of-stock' | 'limited-stock' | 'unknown';
export interface AvailabilityInfo {
    status: AvailabilityStatus;
    confidence: number;
    indicator: string;
}
/**
 * Check if product is available based on text indicators
 */
export declare function checkAvailability(element: Element): AvailabilityInfo;
/**
 * Check availability from price element and container
 */
export declare function isProductAvailable(container: Element, priceElement: Element | null): boolean;
/**
 * Extract availability status for display
 */
export declare function getAvailabilityBadge(status: AvailabilityStatus): {
    text: string;
    color: string;
    emoji: string;
};
//# sourceMappingURL=availability-checker.d.ts.map