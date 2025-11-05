/**
 * Brand Normalization Utilities
 * Handle brand name variations and aliases
 */

/**
 * Brand aliases map - handles common variations
 */
export const BRAND_ALIASES: Record<string, string[]> = {
  // Technology brands
  'Apple': ['iphone', 'ipad', 'macbook', 'airpods', 'apple'],
  'Samsung': ['samsung', 'galaxy'],
  'Xiaomi': ['xiaomi', 'mi', 'redmi', 'poco'],
  'OnePlus': ['oneplus', 'one plus'],
  'Realme': ['realme', 'real me'],
  'Oppo': ['oppo'],
  'Vivo': ['vivo'],
  'Google': ['google', 'pixel'],
  'HP': ['hp', 'hewlett-packard', 'hewlett packard'],
  'Dell': ['dell'],
  'Lenovo': ['lenovo'],
  'Asus': ['asus'],
  'Acer': ['acer'],
  'MSI': ['msi'],
  'Sony': ['sony'],
  'LG': ['lg'],
  'Philips': ['philips'],
  'Panasonic': ['panasonic'],
  'Whirlpool': ['whirlpool'],
  'Bosch': ['bosch'],
  'IFB': ['ifb'],
  'Canon': ['canon'],
  'Nikon': ['nikon'],
  
  // Fashion brands
  'Nike': ['nike'],
  'Adidas': ['adidas'],
  'Puma': ['puma'],
  'Reebok': ['reebok'],
  'Levis': ['levi', 'levis', "levi's"],
  'Zara': ['zara'],
  'H&M': ['h&m', 'hm', 'h and m'],
  'Mango': ['mango'],
  'UCB': ['ucb', 'united colors of benetton', 'benetton'],
  'Allen Solly': ['allen solly', 'allensolly'],
  'Van Heusen': ['van heusen', 'vanheusen'],
  
  // Beauty brands
  'Lakme': ['lakme', 'lakmé'],
  'Maybelline': ['maybelline'],
  "L'Oreal": ['loreal', "l'oreal", 'l oreal'],
  'MAC': ['mac'],
  'Revlon': ['revlon'],
  'Nykaa': ['nykaa'],
  'Mamaearth': ['mamaearth', 'mama earth'],
  
  // Audio brands
  'Boat': ['boat', 'boAt'],
  'JBL': ['jbl'],
  'Bose': ['bose'],
  'Sennheiser': ['sennheiser'],
  
  // Watch brands
  'Fastrack': ['fastrack', 'fast track'],
  'Titan': ['titan'],
  'Casio': ['casio'],
  'Fossil': ['fossil'],
  'Timex': ['timex'],
};

/**
 * Normalize brand name to canonical form
 */
export function normalizeBrand(brand: string): string {
  if (!brand) return '';
  
  const normalized = brand.toLowerCase().trim();
  
  // Check if it's already a canonical brand
  for (const [canonical, aliases] of Object.entries(BRAND_ALIASES)) {
    if (canonical.toLowerCase() === normalized) {
      return canonical;
    }
  }
  
  // Check if it matches any alias
  for (const [canonical, aliases] of Object.entries(BRAND_ALIASES)) {
    if (aliases.some(alias => alias.toLowerCase() === normalized)) {
      return canonical;
    }
  }
  
  // Return original with proper capitalization
  return brand.charAt(0).toUpperCase() + brand.slice(1).toLowerCase();
}

/**
 * Check if two brands are the same (considering aliases)
 */
export function brandsMatch(brand1: string, brand2: string): boolean {
  if (!brand1 || !brand2) return false;
  
  const norm1 = normalizeBrand(brand1);
  const norm2 = normalizeBrand(brand2);
  
  return norm1.toLowerCase() === norm2.toLowerCase();
}

/**
 * Extract brand from title with normalization
 */
export function extractAndNormalizeBrand(title: string): string {
  if (!title) return '';
  
  const titleLower = title.toLowerCase();
  
  // Check each brand's aliases
  for (const [canonical, aliases] of Object.entries(BRAND_ALIASES)) {
    for (const alias of aliases) {
      // Word boundary check
      const regex = new RegExp(`\\b${alias}\\b`, 'i');
      if (regex.test(titleLower)) {
        return canonical;
      }
    }
  }
  
  // Fallback: extract first word if it looks like a brand
  const words = title.split(/\s+/);
  if (words.length > 0) {
    const firstWord = words[0].replace(/[^a-zA-Z]/g, '');
    if (firstWord.length >= 2) {
      return normalizeBrand(firstWord);
    }
  }
  
  return '';
}

/**
 * Get all brand variations for matching
 */
export function getBrandVariations(brand: string): string[] {
  const normalized = normalizeBrand(brand);
  
  for (const [canonical, aliases] of Object.entries(BRAND_ALIASES)) {
    if (canonical === normalized) {
      return [canonical, ...aliases];
    }
  }
  
  return [brand, normalized];
}
