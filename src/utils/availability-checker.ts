/**
 * Product Availability Detection System
 * Detects if a product is in stock, out of stock, or unavailable
 */

export type AvailabilityStatus = 'in-stock' | 'out-of-stock' | 'limited-stock' | 'unknown';

export interface AvailabilityInfo {
  status: AvailabilityStatus;
  confidence: number; // 0-100
  indicator: string; // What triggered this status
}

/**
 * Check if product is available based on text indicators
 */
export function checkAvailability(element: Element): AvailabilityInfo {
  const text = element.textContent?.toLowerCase() || '';
  
  // Out of stock indicators (HIGH CONFIDENCE)
  const outOfStockIndicators = [
    'out of stock',
    'sold out',
    'unavailable',
    'not available',
    'currently unavailable',
    'temporarily unavailable',
    'stock out',
    'no stock',
    'item is no longer available',
    'discontinued',
    'notify me when available',
    'pre-order',
    'coming soon',
  ];

  for (const indicator of outOfStockIndicators) {
    if (text.includes(indicator)) {
      return {
        status: 'out-of-stock',
        confidence: 95,
        indicator: indicator
      };
    }
  }

  // Limited stock indicators (MEDIUM CONFIDENCE)
  const limitedStockIndicators = [
    'only',
    'left in stock',
    'hurry',
    'few items left',
    'limited stock',
    'low stock',
    'almost gone',
    'selling fast',
  ];

  for (const indicator of limitedStockIndicators) {
    if (text.includes(indicator)) {
      return {
        status: 'limited-stock',
        confidence: 70,
        indicator: indicator
      };
    }
  }

  // In stock indicators (HIGH CONFIDENCE)
  const inStockIndicators = [
    'in stock',
    'available',
    'add to cart',
    'buy now',
    'get it by',
    'delivery by',
    'ships from',
    'free delivery',
  ];

  for (const indicator of inStockIndicators) {
    if (text.includes(indicator)) {
      return {
        status: 'in-stock',
        confidence: 90,
        indicator: indicator
      };
    }
  }

  // Default: Unknown (element doesn't have availability info)
  return {
    status: 'unknown',
    confidence: 0,
    indicator: 'no availability info'
  };
}

/**
 * Check availability from price element and container
 */
export function isProductAvailable(container: Element, priceElement: Element | null): boolean {
  // If no price, likely unavailable
  if (!priceElement) {
    return false;
  }

  // Check container for availability indicators
  const containerAvailability = checkAvailability(container);
  
  // If explicitly marked as out of stock, exclude it
  if (containerAvailability.status === 'out-of-stock' && containerAvailability.confidence >= 80) {
    return false;
  }

  // Check for "add to cart" or "buy now" buttons (strong indicator of availability)
  const hasAddToCart = container.querySelector('[data-testid="add-to-cart"], button[name="submit.add-to-cart"], .add-to-cart, .buy-now, [data-action="add-to-cart"]');
  if (hasAddToCart) {
    return true; // Product has action button, likely available
  }

  // Check if price is valid (not placeholder)
  const priceText = priceElement.textContent?.trim() || '';
  if (!priceText || priceText.length === 0) {
    return false;
  }

  // If price contains currency symbol and numbers, assume available
  if (/[₹$€£]\s*\d+|rupees|rs\.?\s*\d+/i.test(priceText)) {
    return true;
  }

  // Default: Assume available if we have a price and no clear unavailable indicator
  return containerAvailability.status !== 'out-of-stock';
}

/**
 * Extract availability status for display
 */
export function getAvailabilityBadge(status: AvailabilityStatus): { text: string; color: string; emoji: string } {
  switch (status) {
    case 'in-stock':
      return { text: 'In Stock', color: '#4CAF50', emoji: '✓' };
    case 'limited-stock':
      return { text: 'Limited', color: '#FF9800', emoji: '⚠️' };
    case 'out-of-stock':
      return { text: 'Out of Stock', color: '#F44336', emoji: '✗' };
    case 'unknown':
    default:
      return { text: '', color: '', emoji: '' };
  }
}
