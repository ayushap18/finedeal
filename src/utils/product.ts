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
    
    // LAPTOP MODELS (NEW!)
    // Acer laptops (Nitro 5, Nitro V 15, Aspire 5, Predator Helios 300)
    /(nitro\s+(?:v\s+)?\d+|aspire\s+\d+|predator\s+\w+\s+\d+|swift\s+\d+)/i,
    // ASUS laptops (TUF F15, ROG Strix G15, VivoBook 15)
    /(tuf\s+[a-z]\d+|rog\s+\w+\s+[a-z]?\d+|vivobook\s+\d+|zenbook\s+\d+)/i,
    // HP laptops (Pavilion 15, Omen 15, Victus 15)
    /(pavilion\s+\d+|omen\s+\d+|victus\s+\d+|envy\s+\d+)/i,
    // Dell laptops (XPS 15, G15, Inspiron 15)
    /(xps\s+\d+|g\d+|inspiron\s+\d+|vostro\s+\d+|latitude\s+\d+)/i,
    // Lenovo laptops (LOQ 15, IdeaPad Gaming 3, ThinkPad X1)
    /(loq\s+\d+|ideapad\s+(?:gaming\s+)?\d+|thinkpad\s+[a-z]\d+|legion\s+\d+)/i,
    // MSI laptops (GF63, Katana 15)
    /(gf\d+|katana\s+\d+|bravo\s+\d+|pulse\s+\d+)/i,
    
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
    return 'electronics-phone';
  }

  if (/(laptop|notebook|macbook|computer|gaming laptop)/i.test(titleLower)) {
    return 'electronics-laptop';
  }

  // Graphics cards are accessories/components, NOT laptops
  if (/(graphics card|gpu|geforce|radeon|video card)/i.test(titleLower)) {
    return 'electronics-gpu';
  }

  if (/(tablet|ipad)/i.test(titleLower)) {
    return 'electronics-tablet';
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
 * NOW WITH PRODUCT NUMBER PRIORITY!
 */
export function generateSearchQueries(title: string, brand?: string, productNumber?: string, productId?: string, url?: string): string[] {
  const queries: string[] = [];
  
  // STRATEGY 0: Pure Product Number (HIGHEST PRIORITY - NEW!)
  // Import product number extractor dynamically
  if (productNumber) {
    // Pure product number search (most accurate)
    queries.push(productNumber);
    
    // Brand + Product number
    if (brand) {
      queries.push(`${brand} ${productNumber}`.trim());
    }
  } else {
    // Try to extract product number from title/URL
    const productNumberPatterns = [
      // Apple part numbers (e.g., MK2L3HN/A)
      /\b([A-Z]{2}\d{2,3}[A-Z0-9]{2}\/[A-Z])\b/,
      // Samsung model numbers (e.g., SM-G991B)
      /\bSM-([A-Z]\d{3,4}[A-Z]?)\b/,
      // SKU codes
      /\bSKU[-:\s]?([A-Z0-9]{5,10})\b/i,
      // Generic alphanumeric codes
      /\b([A-Z]{2,4}[-]?\d{4,6}[A-Z0-9]?)\b/,
    ];
    
    for (const pattern of productNumberPatterns) {
      const match = title.match(pattern);
      if (match) {
        const extractedNumber = match[1] || match[0];
        queries.push(extractedNumber);
        if (brand) {
          queries.push(`${brand} ${extractedNumber}`.trim());
        }
        break; // Use first found product number
      }
    }
    
    // Try ASIN from URL
    if (url) {
      const asinMatch = url.match(/\/dp\/([A-Z0-9]{10})|asin=([A-Z0-9]{10})/i);
      if (asinMatch) {
        const asin = asinMatch[1] || asinMatch[2];
        queries.push(asin);
      }
    }
    
    // Try productId if it looks like a valid SKU (not just a hash)
    if (productId && /^[A-Z0-9]{6,15}$/i.test(productId)) {
      queries.push(productId);
      if (brand) {
        queries.push(`${brand} ${productId}`.trim());
      }
    }
  }
  
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
  return [...new Set(queries)].filter(q => q.length >= 3 && q.length <= 60);
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
