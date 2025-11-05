import { Product } from '@/types';

/**
 * Deduplicate products before matching
 * Removes color variants and keeps cheapest option per site
 */
export function deduplicateProducts(products: Product[]): Product[] {
  const siteMap = new Map<string, Product[]>();

  // Group by site
  products.forEach(product => {
    const existing = siteMap.get(product.site) || [];
    existing.push(product);
    siteMap.set(product.site, existing);
  });

  const deduplicated: Product[] = [];

  // For each site, deduplicate similar products
  siteMap.forEach((siteProducts, site) => {
    const uniqueProducts = deduplicateSiteProducts(siteProducts);
    deduplicated.push(...uniqueProducts);
  });

  return deduplicated;
}

/**
 * Deduplicate products from the same site
 */
function deduplicateSiteProducts(products: Product[]): Product[] {
  const groups = new Map<string, Product[]>();

  products.forEach(product => {
    // Create normalized key (remove colors, sizes, variant info)
    const key = normalizeProductKey(product);
    const existing = groups.get(key) || [];
    existing.push(product);
    groups.set(key, existing);
  });

  const result: Product[] = [];

  // For each group, keep the cheapest variant
  groups.forEach(group => {
    if (group.length === 1) {
      result.push(group[0]);
    } else {
      // Keep cheapest
      const cheapest = group.reduce((min, p) => 
        p.price < min.price ? p : min
      );
      result.push(cheapest);
    }
  });

  return result;
}

/**
 * Normalize product key for deduplication
 * Removes color, size, and variant information
 */
function normalizeProductKey(product: Product): string {
  let key = product.title.toLowerCase();

  // Remove common color words
  const colors = [
    'black', 'white', 'red', 'blue', 'green', 'yellow', 'pink', 'purple', 'orange',
    'grey', 'gray', 'brown', 'beige', 'navy', 'maroon', 'teal', 'olive', 'gold',
    'silver', 'rose', 'mint', 'coral', 'cream', 'ivory', 'khaki', 'cyan', 'magenta'
  ];

  colors.forEach(color => {
    key = key.replace(new RegExp(`\\b${color}\\b`, 'gi'), '');
  });

  // Remove size information
  key = key.replace(/\b(xs|s|m|l|xl|xxl|xxxl)\b/gi, '');
  key = key.replace(/\b\d+(\.\d+)?\s*(gb|tb|mb|kg|g|ml|l|inch|cm|mm)\b/gi, '');

  // Remove variant keywords
  const variantWords = ['variant', 'color', 'colour', 'size', 'pack of', 'combo'];
  variantWords.forEach(word => {
    key = key.replace(new RegExp(`\\b${word}\\b`, 'gi'), '');
  });

  // Remove extra whitespace and normalize
  key = key.replace(/\s+/g, ' ').trim();

  // Add brand for better grouping
  const brand = product.brand || '';
  
  return `${brand.toLowerCase()}:${key}`;
}
