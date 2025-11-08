/**
 * Advanced Product Number/SKU Extraction System
 * Extracts model numbers, SKUs, part numbers, ASINs, and other product identifiers
 */

export interface ProductNumberInfo {
  productNumber: string; // Primary product number (SKU, model, etc.)
  modelNumber: string; // Model number (e.g., "SM-G991B")
  partNumber: string; // Part number (e.g., "MK2L3HN/A")
  sku: string; // SKU code
  asin: string; // Amazon ASIN
  confidence: number; // Confidence score (0-100)
  source: 'title' | 'attribute' | 'url'; // Where it was found
}

/**
 * Extract all product numbers/identifiers from title
 */
export function extractProductNumbers(title: string, productId?: string, url?: string): ProductNumberInfo {
  const result: ProductNumberInfo = {
    productNumber: '',
    modelNumber: '',
    partNumber: '',
    sku: '',
    asin: '',
    confidence: 0,
    source: 'title'
  };

  // Strategy 1: Extract ASIN from productId or URL (HIGHEST CONFIDENCE)
  if (productId && /^[A-Z0-9]{10}$/.test(productId)) {
    result.asin = productId;
    result.productNumber = productId;
    result.confidence = 100;
    result.source = 'attribute';
    return result;
  }

  if (url) {
    const asinMatch = url.match(/\/dp\/([A-Z0-9]{10})|\/product\/([A-Z0-9]{10})|asin=([A-Z0-9]{10})/i);
    if (asinMatch) {
      result.asin = asinMatch[1] || asinMatch[2] || asinMatch[3];
      result.productNumber = result.asin;
      result.confidence = 100;
      result.source = 'url';
      return result;
    }
  }

  // Strategy 2: Extract model numbers from title
  const modelPatterns = [
    // Apple part numbers (e.g., MK2L3HN/A, MLWK3HN/A)
    /\b([A-Z]{2}\d{2,3}[A-Z0-9]{2}\/[A-Z])\b/,
    
    // Samsung model numbers (e.g., SM-G991B, SM-A525F)
    /\b(SM-[A-Z]\d{3,4}[A-Z]?)\b/,
    
    // Acer/Asus laptop models (e.g., AN515-58, TUF-F15, ROG-G15)
    /\b([A-Z]{2,4}[-]?\d{3,4}[-]?\d{0,2}[A-Z]?)\b/,
    
    // Dell/HP/Lenovo models (e.g., XPS-15, G15-5520, LOQ-15)
    /\b([A-Z]{2,4}[-]?\d{2}[-]?\d{4})\b/,
    
    // Generic laptop/product codes (e.g., V15-2025, G16-2024)
    /\b([A-Z]\d{2}[-]?\d{4})\b/,
    
    // SKU patterns (e.g., SKU123456, SKU-12345)
    /\b(SKU[-:\s]?[A-Z0-9]{5,10})\b/i,
    
    // Part numbers (e.g., PN12345, PART-12345)
    /\b((?:PN|PART)[-:\s]?[A-Z0-9]{5,10})\b/i,
    
    // IMEI-like patterns (15 digits)
    /\b(\d{15})\b/,
    
    // Alphanumeric codes (6-12 chars, common in electronics)
    /\b([A-Z]{1,2}\d{4,6}[A-Z0-9]{0,2})\b/,
  ];

  for (const pattern of modelPatterns) {
    const match = title.match(pattern);
    if (match) {
      const extracted = match[1];
      
      // Determine what type it is
      if (extracted.includes('SKU')) {
        result.sku = extracted;
        result.productNumber = extracted;
        result.confidence = 95;
      } else if (extracted.includes('PN') || extracted.includes('PART')) {
        result.partNumber = extracted;
        result.productNumber = extracted;
        result.confidence = 95;
      } else if (extracted.match(/SM-[A-Z]\d{3,4}/)) {
        result.modelNumber = extracted;
        result.productNumber = extracted;
        result.confidence = 90;
      } else if (extracted.match(/[A-Z]{2}\d{2,3}[A-Z0-9]{2}\/[A-Z]/)) {
        result.partNumber = extracted; // Apple part number
        result.productNumber = extracted;
        result.confidence = 95;
      } else if (extracted.length === 15 && /^\d+$/.test(extracted)) {
        result.modelNumber = extracted; // IMEI or long code
        result.productNumber = extracted;
        result.confidence = 80;
      } else {
        result.modelNumber = extracted;
        result.productNumber = extracted;
        result.confidence = 75;
      }
      
      result.source = 'title';
      return result;
    }
  }

  // Strategy 3: Extract from common patterns in parentheses or brackets
  const bracketMatch = title.match(/[\(\[]([A-Z0-9\-\/]{6,15})[\)\]]/);
  if (bracketMatch) {
    result.modelNumber = bracketMatch[1];
    result.productNumber = bracketMatch[1];
    result.confidence = 70;
    result.source = 'title';
    return result;
  }

  // Strategy 4: Extract standalone alphanumeric codes
  const codeMatch = title.match(/\b([A-Z]\d{5,8})\b/);
  if (codeMatch) {
    result.modelNumber = codeMatch[1];
    result.productNumber = codeMatch[1];
    result.confidence = 60;
    result.source = 'title';
  }

  return result;
}

/**
 * Compare two product numbers for matching
 */
export function productNumbersMatch(num1: ProductNumberInfo, num2: ProductNumberInfo): boolean {
  if (!num1.productNumber || !num2.productNumber) {
    return false;
  }

  // Exact match on any identifier
  if (num1.productNumber === num2.productNumber) return true;
  if (num1.asin && num1.asin === num2.asin) return true;
  if (num1.sku && num1.sku === num2.sku) return true;
  if (num1.partNumber && num1.partNumber === num2.partNumber) return true;
  if (num1.modelNumber && num1.modelNumber === num2.modelNumber) return true;

  // Fuzzy match (handle variations like spaces, dashes)
  const clean1 = num1.productNumber.replace(/[\s\-]/g, '').toUpperCase();
  const clean2 = num2.productNumber.replace(/[\s\-]/g, '').toUpperCase();
  
  if (clean1 === clean2) return true;
  
  // Partial match for long codes (e.g., "SM-G991B" matches "G991B")
  if (clean1.length >= 6 && clean2.length >= 6) {
    if (clean1.includes(clean2) || clean2.includes(clean1)) {
      return true;
    }
  }

  return false;
}

/**
 * Generate search query focused on product number
 */
export function generateProductNumberQuery(productInfo: ProductNumberInfo, brand?: string): string {
  if (!productInfo.productNumber) return '';

  const queries: string[] = [];

  // Priority 1: Brand + Product Number
  if (brand && productInfo.productNumber) {
    queries.push(`${brand} ${productInfo.productNumber}`);
  }

  // Priority 2: Just Product Number (pure)
  if (productInfo.productNumber) {
    queries.push(productInfo.productNumber);
  }

  // Priority 3: Model Number variants
  if (productInfo.modelNumber && productInfo.modelNumber !== productInfo.productNumber) {
    if (brand) {
      queries.push(`${brand} ${productInfo.modelNumber}`);
    }
    queries.push(productInfo.modelNumber);
  }

  return queries[0] || '';
}

/**
 * Check if title contains product number indicators
 */
export function hasProductNumber(title: string): boolean {
  const indicators = [
    /\b[A-Z]{2}\d{2,3}[A-Z0-9]{2}\/[A-Z]\b/, // Apple part numbers
    /\bSM-[A-Z]\d{3,4}[A-Z]?\b/, // Samsung models
    /\bSKU[-:\s]?[A-Z0-9]{5,10}\b/i, // SKU codes
    /\b[A-Z]{2,4}[-\s]?\d{3,5}[A-Z]?\b/, // Generic models
  ];

  return indicators.some(pattern => pattern.test(title));
}

/**
 * Extract product number from URL patterns
 */
export function extractProductNumberFromUrl(url: string): string {
  // Amazon ASIN
  const asinMatch = url.match(/\/dp\/([A-Z0-9]{10})|\/product\/([A-Z0-9]{10})|asin=([A-Z0-9]{10})/i);
  if (asinMatch) {
    return asinMatch[1] || asinMatch[2] || asinMatch[3];
  }

  // Flipkart product ID
  const flipkartMatch = url.match(/\/p\/([A-Z0-9]+)\?/i);
  if (flipkartMatch) {
    return flipkartMatch[1];
  }

  // Generic product ID patterns
  const genericMatch = url.match(/[?&](?:pid|productId|id)=([A-Z0-9-_]+)/i);
  if (genericMatch) {
    return genericMatch[1];
  }

  return '';
}
