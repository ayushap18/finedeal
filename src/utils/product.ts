/**
 * Parse price string to number
 */
export function parsePrice(priceText: string): number {
  if (!priceText) return 0;
  
  // Remove all non-numeric characters except decimal point
  const cleaned = priceText.replace(/[^\d.]/g, '');
  const parsed = parseFloat(cleaned);
  
  return isNaN(parsed) ? 0 : Math.round(parsed);
}

/**
 * Format price to display string
 */
export function formatPrice(price: number, currency: string = '₹'): string {
  return `${currency}${price.toLocaleString('en-IN')}`;
}

/**
 * Calculate price difference
 */
export function calculatePriceDiff(original: number, compare: number): {
  diff: number;
  percent: number;
  isCheaper: boolean;
} {
  const diff = original - compare;
  const percent = Math.abs(Math.round((diff / original) * 100));
  
  return {
    diff: Math.abs(diff),
    percent,
    isCheaper: diff > 0,
  };
}

/**
 * Extract brand from title
 */
export function extractBrand(title: string): string {
  const commonBrands = [
    'Apple', 'Samsung', 'Xiaomi', 'OnePlus', 'Realme', 'Vivo', 'Oppo', 'Nokia',
    'iPhone', 'iPad', 'MacBook', 'Galaxy', 'Pixel', 'Mi', 'Redmi',
    'Nike', 'Adidas', 'Puma', 'Reebok', 'Levi', 'Zara', 'H&M', 'Mango',
    'Lakme', 'Maybelline', 'L\'Oreal', 'MAC', 'Revlon', 'Nykaa',
    'Sony', 'LG', 'Philips', 'Panasonic', 'Whirlpool', 'Bosch', 'IFB',
    'Dell', 'HP', 'Lenovo', 'Asus', 'Acer', 'MSI',
    'Boat', 'JBL', 'Bose', 'Sennheiser', 'Canon', 'Nikon',
  ];

  const titleLower = title.toLowerCase();
  
  // Special handling for Apple products
  if (/(iphone|ipad|macbook|airpods|apple)/i.test(titleLower)) {
    return 'Apple';
  }
  
  // Check for brand names
  for (const brand of commonBrands) {
    if (titleLower.includes(brand.toLowerCase())) {
      return brand;
    }
  }
  
  // Extract first word as potential brand
  const words = title.trim().split(/\s+/);
  return words[0] || '';
}

/**
 * Extract model from title (includes brand+model for better matching)
 */
export function extractModel(title: string): string {
  const patterns = [
    // iPhone patterns - capture full "iPhone 15" etc
    /(iphone\s*\d+[a-z]*(?:\s+pro)?(?:\s+max)?(?:\s+plus)?(?:\s+mini)?)/i,
    // Samsung Galaxy - capture full "Galaxy S23" etc
    /(galaxy\s+[a-z]\d+\s*(?:pro|plus|ultra)?)/i,
    // OnePlus - capture full "OnePlus 11" etc
    /(oneplus\s+\d+[a-z]*(?:\s+pro)?(?:\s+r)?(?:\s+t)?)/i,
    // Pixel - capture full "Pixel 7" etc
    /(pixel\s+\d+[a-z]*(?:\s+pro)?(?:\s+xl)?)/i,
    // Redmi/Mi
    /((?:redmi|mi)\s+\d+[a-z]*(?:\s+pro)?)/i,
    // Generic model numbers (fallback)
    /\b([a-z]{1,3}\d{2,4}[a-z]?)\b/i,
  ];

  for (const pattern of patterns) {
    const match = title.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }

  return '';
}

/**
 * Extract storage/capacity
 */
export function extractStorage(title: string): string {
  const match = title.match(/\b(\d+)\s*(gb|tb)\b/i);
  return match ? `${match[1]}${match[2].toUpperCase()}` : '';
}

/**
 * Extract RAM
 */
export function extractRAM(title: string): string {
  const match = title.match(/\b(\d+)\s*gb\s+ram\b/i);
  return match ? `${match[1]}GB` : '';
}

/**
 * Extract color
 */
export function extractColor(title: string): string {
  const colors = [
    'black', 'white', 'blue', 'red', 'green', 'yellow', 'pink', 'purple',
    'gray', 'grey', 'silver', 'gold', 'rose', 'titanium', 'midnight',
    'starlight', 'navy', 'maroon', 'beige', 'brown', 'orange',
  ];

  const titleLower = title.toLowerCase();
  for (const color of colors) {
    if (titleLower.includes(color)) {
      return color.charAt(0).toUpperCase() + color.slice(1);
    }
  }

  return '';
}

/**
 * Detect product category
 */
export function detectCategory(title: string): string {
  const titleLower = title.toLowerCase();

  if (/(phone|mobile|smartphone|iphone|galaxy)/i.test(titleLower)) {
    return 'electronics';
  }

  if (/(laptop|notebook|macbook|computer)/i.test(titleLower)) {
    return 'electronics';
  }

  if (/(shirt|jeans|dress|trouser|shoe|sneaker|jacket|hoodie|kurta|saree)/i.test(titleLower)) {
    return 'fashion';
  }

  if (/(lipstick|makeup|foundation|cream|lotion|serum|shampoo|perfume)/i.test(titleLower)) {
    return 'beauty';
  }

  return 'general';
}

/**
 * Generate multiple search queries with fallback strategies (Google Shopping style)
 */
export function generateSearchQueries(title: string, brand?: string): string[] {
  const queries: string[] = [];
  
  // Clean title
  let cleanTitle = title
    .replace(/\([^)]*\)/g, '') // Remove parentheses
    .replace(/:[^:]*$/, '') // Remove colon content
    .replace(/\|.*/g, '') // Remove pipe content
    .replace(/[-–—]/g, ' ') // Replace dashes
    .trim();

  const model = extractModel(title);
  const storage = extractStorage(title);
  const ram = extractRAM(title);
  const detectedBrand = brand || extractBrand(title);

  // Strategy 1: Brand + Model + Storage (BEST - most specific)
  if (detectedBrand && model && storage) {
    queries.push(`${detectedBrand} ${model} ${storage}`.trim());
  }

  // Strategy 2: Brand + Model + RAM
  if (detectedBrand && model && ram) {
    queries.push(`${detectedBrand} ${model} ${ram}`.trim());
  }

  // Strategy 3: Brand + Model (GOOD - balanced)
  if (detectedBrand && model) {
    queries.push(`${detectedBrand} ${model}`.trim());
  }

  // Strategy 4: Model + Storage
  if (model && storage) {
    queries.push(`${model} ${storage}`.trim());
  }

  // Strategy 5: Just Model (fallback)
  if (model) {
    queries.push(model);
  }

  // Strategy 6: Brand + Key Words
  if (detectedBrand) {
    const keyWords = cleanTitle
      .split(/\s+/)
      .filter(w => w.length > 3 && !/^(with|from|for|the|and|that|this)$/i.test(w))
      .slice(0, 3)
      .join(' ');
    if (keyWords) {
      queries.push(`${detectedBrand} ${keyWords}`.trim());
    }
  }

  // Strategy 7: Short cleaned title
  const shortTitle = cleanTitle
    .split(/\s+/)
    .filter(w => w.length > 2)
    .slice(0, 5)
    .join(' ');
  if (shortTitle && !queries.includes(shortTitle)) {
    queries.push(shortTitle);
  }

  // Remove duplicates and too short queries
  return [...new Set(queries)].filter(q => q.length >= 5 && q.length <= 60);
}

/**
 * Generate search query from product title (uses best strategy)
 */
export function generateSearchQuery(title: string, brand?: string): string {
  const queries = generateSearchQueries(title, brand);
  return queries[0] || title.substring(0, 50);
}

/**
 * OLD VERSION - kept for compatibility
 * Generate search query from product title
 */
export function generateSearchQueryLegacy(title: string, brand?: string): string {
  // Remove common marketing words
  let cleaned = title
    .replace(/\([^)]*\)/g, '') // Remove parentheses content
    .replace(/:[^:]*$/, '') // Remove after colon
    .replace(/\|.*/g, '') // Remove after pipe
    .split(/[-–—]/)[0] // Take first part before dash
    .trim();

  // Extract key terms
  const model = extractModel(cleaned);
  const storage = extractStorage(cleaned);
  const extractedBrand = brand || extractBrand(cleaned);

  // Build query
  let query = '';
  if (extractedBrand) query += extractedBrand + ' ';
  if (model) query += model + ' ';
  if (storage) query += storage;

  // Fallback: use first 5 meaningful words
  if (!query.trim()) {
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'for', 'of', 'in', 'on', 'at', 'to', 'with'];
    query = cleaned
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.includes(w.toLowerCase()))
      .slice(0, 5)
      .join(' ');
  }

  return query.trim().substring(0, 60); // Limit length
}
