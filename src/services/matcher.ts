import { Product, MatchResult, MatchLevel, ProductAttributes } from '@/types';
import { extractModel, extractStorage, extractRAM, extractColor } from '@/utils/product';
import { normalizeBrand, brandsMatch } from '@/utils/brand-normalization';
import logger from '@/utils/logger';

/**
 * Production-level Product Matching Engine
 * Uses multiple algorithms: exact matching, fuzzy matching, ML-inspired scoring
 */
export class ProductMatcher {
  private readonly MIN_CONFIDENCE = 25; // Raised to filter out poor matches
  private readonly ACCESSORY_KEYWORDS = [
    'case', 'cover', 'charger', 'cable', 'adapter', 'holder', 'stand',
    'protector', 'screen guard', 'tempered glass', 'skin', 'pouch',
    'sleeve', 'bag', 'strap', 'band', 'compatible', 'accessory',
  ];

  /**
   * Find matching products with confidence scoring (OPTIMIZED)
   */
  async findMatches(sourceProduct: Product, candidates: Product[]): Promise<MatchResult[]> {
    logger.time('Product Matching');
    logger.group('Product Matching');
    logger.info(`Source: ${sourceProduct.title}`);
    logger.info(`Candidates: ${candidates.length}`);

    try {
      // OPTIMIZATION 1: Quick validation (fail fast)
      const validCandidates = candidates.filter(p => 
        p.numericPrice >= 10 && p.title?.length >= 5
      );
      logger.info(`After validation: ${validCandidates.length} valid products`);

      // OPTIMIZATION 2: Filter accessories early (single pass)
      const filtered = this.filterAccessories(sourceProduct, validCandidates);
      logger.info(`After accessory filter: ${filtered.length}`);

      if (filtered.length === 0) {
        logger.warn('No products after filtering');
        return [];
      }

      // OPTIMIZATION 3: Extract attributes once (cache)
      const sourceAttrs = this.extractAttributes(sourceProduct);
      logger.info('Source attributes:', {
        model: sourceAttrs.model,
        storage: sourceAttrs.storage,
        brand: sourceProduct.brand
      });

      // OPTIMIZATION 4: Match by levels (early exit on success)
      const matches: MatchResult[] = [];

      // Level 1: Exact Product ID (100% confidence) - FAST
      if (sourceProduct.productId) {
        const exactMatches = this.findExactIdMatches(sourceProduct, filtered);
        if (exactMatches.length > 0) {
          logger.info(`✅ Level 1: ${exactMatches.length} exact ID matches - EARLY EXIT`);
          return this.sortAndLimit(exactMatches);
        }
      }

      // Level 2: Brand + Model + Storage (85-95% confidence) - FAST
      const level2 = this.findBrandModelStorageMatches(sourceProduct, sourceAttrs, filtered);
      matches.push(...level2);
      logger.info(`✅ Level 2: ${level2.length} brand+model+storage matches`);

      // OPTIMIZATION 5: If we have 5+ good matches, skip expensive fuzzy matching
      if (matches.length >= 5) {
        logger.info(`✅ Early exit with ${matches.length} high-confidence matches`);
        return this.sortAndLimit(matches);
      }

      // Level 3: Brand + Model (70-84% confidence) - FAST
      const level3 = this.findBrandModelMatches(sourceProduct, sourceAttrs, filtered);
      matches.push(...level3);
      logger.info(`✅ Level 3: ${level3.length} brand+model matches`);

      // OPTIMIZATION 6: Only do fuzzy matching if we have <3 matches
      if (matches.length < 3) {
        // Level 4: Brand + Fuzzy (20-69% confidence) - SLOW (only when needed)
        const level4 = this.findFuzzyMatches(sourceProduct, sourceAttrs, filtered);
        matches.push(...level4);
        logger.info(`✅ Level 4: ${level4.length} fuzzy matches`);
      } else {
        logger.info(`⚡ Skipping fuzzy matching (already have ${matches.length} matches)`);
      }

      const finalMatches = this.sortAndLimit(matches);
      logger.info(`📊 Total matches after filtering: ${finalMatches.length}`);
      
      // OPTIMIZATION 7: Reduced logging in production
      if (finalMatches.length > 0) {
        logger.info('Top matches:', finalMatches.slice(0, 2).map(m => ({
          title: m.title.substring(0, 40),
          confidence: m.confidence,
          site: m.site
        })));
      }
      
      return finalMatches;
    } catch (error) {
      logger.error('Matching error:', error);
      return [];
    } finally {
      logger.groupEnd();
      logger.timeEnd('Product Matching');
    }
  }

  /**
   * Level 1: Exact Product ID matching
   */
  private findExactIdMatches(source: Product, candidates: Product[]): MatchResult[] {
    return candidates
      .filter((c) => c.productId === source.productId)
      .map((c) => ({
        ...c,
        confidence: 100,
        matchLevel: MatchLevel.EXACT_ID,
        matchBadge: '🎯 EXACT',
        matchReason: 'Exact Product ID',
      }));
  }

  /**
   * Level 2: Brand + Model + Storage matching
   */
  private findBrandModelStorageMatches(
    source: Product,
    sourceAttrs: ProductAttributes,
    candidates: Product[]
  ): MatchResult[] {
    const matches: MatchResult[] = [];

    if (!sourceAttrs.model) return matches;

    for (const candidate of candidates) {
      const candAttrs = this.extractAttributes(candidate);

      // Very lenient - just need model match
      const modelsMatch = this.compareModels(sourceAttrs.model, candAttrs.model);
      
      if (modelsMatch) {
        // Check storage
        if (sourceAttrs.storage && candAttrs.storage) {
          if (sourceAttrs.storage === candAttrs.storage) {
            matches.push({
              ...candidate,
              confidence: 95,
              matchLevel: MatchLevel.EXACT,
              matchBadge: '🎯 EXACT',
              matchReason: `${candAttrs.model} ${candAttrs.storage}`,
            });
          } else {
            // Different storage but same model
            matches.push({
              ...candidate,
              confidence: 80,
              matchLevel: MatchLevel.HIGH,
              matchBadge: '✓ HIGH',
              matchReason: `${candAttrs.model} (different storage)`,
            });
          }
        } else {
          // Model matches but storage unknown
          matches.push({
            ...candidate,
            confidence: 85,
            matchLevel: MatchLevel.HIGH,
            matchBadge: '✓ HIGH',
            matchReason: `${candAttrs.model}`,
          });
        }
      }
    }

    return matches;
  }

  /**
   * Level 3: Brand + Model matching (without storage)
   */
  private findBrandModelMatches(
    source: Product,
    sourceAttrs: ProductAttributes,
    candidates: Product[]
  ): MatchResult[] {
    const matches: MatchResult[] = [];

    if (!sourceAttrs.model) return matches;

    for (const candidate of candidates) {
      const candAttrs = this.extractAttributes(candidate);

      // More lenient brand check
      const brandsMatch = this.compareBrands(sourceAttrs, candAttrs);
      const modelsMatch = candAttrs.model && this.compareModels(sourceAttrs.model, candAttrs.model);
      
      if (brandsMatch || modelsMatch) {
        const similarity = this.calculateTextSimilarity(source.title, candidate.title);
        let confidence = Math.min(84, Math.max(70, Math.round(70 + similarity * 14)));

        // FUZZY PRICE MATCHING: Boost confidence if price is similar (0.7-1.3x range)
        const priceRatio = candidate.numericPrice / source.numericPrice;
        if (priceRatio >= 0.7 && priceRatio <= 1.3) {
          confidence = Math.min(95, confidence + 10); // Boost by 10%
          logger.debug(`Price boost: ${candidate.title.substring(0, 30)} (ratio: ${priceRatio.toFixed(2)})`);
        }

        matches.push({
          ...candidate,
          confidence,
          matchLevel: MatchLevel.MEDIUM,
          matchBadge: '≈ MEDIUM',
          matchReason: `${candAttrs.model || 'Similar model'}`,
          similarity,
        });
      }
    }

    return matches;
  }

  /**
   * Level 4: Fuzzy matching with brand validation
   */
  private findFuzzyMatches(
    source: Product,
    sourceAttrs: ProductAttributes,
    candidates: Product[]
  ): MatchResult[] {
    const matches: MatchResult[] = [];

    for (const candidate of candidates) {
      const candAttrs = this.extractAttributes(candidate);

      const brandsMatch = this.compareBrands(sourceAttrs, candAttrs);
      const similarity = this.calculateTextSimilarity(source.title, candidate.title);

      // ULTRA lenient - accept even 15% similarity OR any brand match OR common keywords
      const hasCommonKeywords = this.hasCommonKeywords(source.title, candidate.title);
      
      if (similarity >= 0.15 || brandsMatch || hasCommonKeywords) {
        let confidence = Math.min(69, Math.max(5, Math.round(5 + similarity * 64)));

        // FUZZY PRICE MATCHING: Boost confidence if price is similar (0.7-1.3x range)
        const priceRatio = candidate.numericPrice / source.numericPrice;
        if (priceRatio >= 0.7 && priceRatio <= 1.3) {
          confidence = Math.min(80, confidence + 15); // Larger boost for fuzzy matches
          logger.debug(`Fuzzy price boost: ${candidate.title.substring(0, 30)} (ratio: ${priceRatio.toFixed(2)})`);
        }

        if (confidence >= this.MIN_CONFIDENCE) {
          matches.push({
            ...candidate,
            confidence,
            matchLevel: MatchLevel.LOW,
            matchBadge: '~ RELATED',
            matchReason: `Similar product (${Math.round(similarity * 100)}% match)`,
            similarity,
          });
        }
      }
    }

    return matches;
  }

  /**
   * Filter out accessories unless source is an accessory
   */
  private filterAccessories(source: Product, candidates: Product[]): Product[] {
    const sourceIsAccessory = this.isAccessory(source.title);

    // Be lenient - only filter obvious accessories
    return candidates.filter((c) => {
      if (sourceIsAccessory) return true; // If source is accessory, show all accessories
      
      const isAccessory = this.isAccessory(c.title);
      
      // Don't filter if title has phone/laptop keywords even with accessory words
      if (/(phone|mobile|smartphone|laptop|tablet|watch|speaker)/i.test(c.title.toLowerCase())) {
        return true;
      }
      
      return !isAccessory;
    });
  }

  /**
   * Check if product is an accessory
   */
  private isAccessory(title: string): boolean {
    const titleLower = title.toLowerCase();
    return this.ACCESSORY_KEYWORDS.some((keyword) => titleLower.includes(keyword));
  }

  /**
   * Extract all attributes from product
   */
  private extractAttributes(product: Product): Required<ProductAttributes> {
    const model = extractModel(product.title);
    const storage = extractStorage(product.title);
    const ram = extractRAM(product.title);
    const color = extractColor(product.title);
    const brand = normalizeBrand(product.brand || ''); // BRAND NORMALIZATION

    return {
      model,
      storage,
      ram,
      color,
      size: '',
      variant: '',
      brand,
    };
  }

  /**
   * Compare brands (with normalization and alias support)
   */
  private compareBrands(attr1: ProductAttributes, attr2: ProductAttributes): boolean {
    // BRAND NORMALIZATION: Use normalized brand comparison
    const brand1 = attr1.brand || '';
    const brand2 = attr2.brand || '';
    
    if (brand1 && brand2) {
      const match = brandsMatch(brand1, brand2);
      if (match) {
        logger.debug(`Brand match: ${brand1} === ${brand2}`);
        return true;
      }
    }
    
    // Fallback: Extract brand from model string (e.g., "iPhone 15" -> check for common brand patterns)
    const model1 = (attr1.model || '').toLowerCase();
    const model2 = (attr2.model || '').toLowerCase();
    
    // If models match, brands likely match
    if (model1 && model2 && (model1 === model2 || model1.includes(model2) || model2.includes(model1))) {
      return true;
    }
    
    // Check for common brand keywords in models - expanded list
    const commonBrands = [
      'iphone', 'samsung', 'galaxy', 'oneplus', 'xiaomi', 'redmi', 'mi',
      'oppo', 'vivo', 'realme', 'pixel', 'poco', 'motorola', 'moto',
      'nokia', 'asus', 'lenovo', 'dell', 'hp', 'acer', 'apple', 'macbook'
    ];
    
    for (const brand of commonBrands) {
      if (model1.includes(brand) && model2.includes(brand)) {
        return true;
      }
    }
    
    // Check if both contain similar numeric patterns (e.g., "15" in "iPhone 15")
    const nums1 = model1.match(/\d+/g);
    const nums2 = model2.match(/\d+/g);
    if (nums1 && nums2) {
      for (const num of nums1) {
        if (nums2.includes(num) && num.length >= 2) {
          // If they share a significant number, likely same product line
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Compare models (handles variations like "15 Pro" vs "15Pro")
   */
  private compareModels(model1?: string, model2?: string): boolean {
    if (!model1 || !model2) return false;

    const clean1 = model1.toLowerCase().replace(/[^a-z0-9]/g, '');
    const clean2 = model2.toLowerCase().replace(/[^a-z0-9]/g, '');

    // Exact match
    if (clean1 === clean2) return true;
    
    // Contains match (lenient)
    if (clean1.includes(clean2) || clean2.includes(clean1)) return true;
    
    // Check if they share significant numbers (e.g., both have "15")
    const nums1 = clean1.match(/\d+/g);
    const nums2 = clean2.match(/\d+/g);
    if (nums1 && nums2) {
      for (const num of nums1) {
        if (nums2.includes(num) && num.length >= 2) {
          return true; // Share same model number
        }
      }
    }
    
    return false;
  }

  /**
   * Calculate text similarity using Jaccard similarity
   */
  private calculateTextSimilarity(text1: string, text2: string): number {
    const tokens1 = this.tokenize(text1);
    const tokens2 = this.tokenize(text2);

    const set1 = new Set(tokens1);
    const set2 = new Set(tokens2);

    const intersection = new Set([...set1].filter((x) => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Tokenize text (remove stop words)
   */
  private tokenize(text: string): string[] {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'for', 'with', 'from', 'to', 'in', 'on', 'at',
    ]);

    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !stopWords.has(w));
  }

  /**
   * Check if two titles share common important keywords
   */
  private hasCommonKeywords(title1: string, title2: string): boolean {
    const keywords1 = this.tokenize(title1);
    const keywords2 = this.tokenize(title2);
    
    // Check for at least 2 common keywords
    const common = keywords1.filter(k => keywords2.includes(k));
    return common.length >= 2;
  }

  /**
   * Sort matches by confidence and limit results
   */
  private sortAndLimit(matches: MatchResult[], limit = 20): MatchResult[] {
    return matches
      .filter((m) => m.confidence >= this.MIN_CONFIDENCE)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, limit);
  }

  /**
   * Find similar products when exact matches fail
   * Matches by: Brand + Category, Brand + Color, Brand + Shade (beauty products)
   */
  async findSimilarProducts(sourceProduct: Product, candidates: Product[]): Promise<MatchResult[]> {
    logger.info('🔍 Finding similar products...');
    const matches: MatchResult[] = [];

    const sourceBrand = (sourceProduct.brand || '').toLowerCase();
    const sourceCategory = sourceProduct.category?.toLowerCase() || '';
    const sourceTitle = sourceProduct.title.toLowerCase();

    // Extract color/shade from title
    const colorMatch = sourceTitle.match(/\b(black|white|blue|red|green|yellow|pink|purple|grey|gray|silver|gold|rose|midnight|starlight|coral|velvet|ocean)\b/i);
    const sourceColor = colorMatch ? colorMatch[0].toLowerCase() : '';

    // Extract shade number for beauty products (e.g., "shade 01", "01 fair", "102 natural")
    const shadeMatch = sourceTitle.match(/\b(shade\s*)?(\d{1,3})\b|\b(fair|light|medium|dark|deep|ivory|beige|nude|natural)\b/i);
    const sourceShade = shadeMatch ? shadeMatch[0].toLowerCase() : '';

    logger.info('Similar product criteria:', {
      brand: sourceBrand,
      category: sourceCategory,
      color: sourceColor,
      shade: sourceShade
    });

    for (const candidate of candidates) {
      const candBrand = (candidate.brand || '').toLowerCase();
      const candCategory = candidate.category?.toLowerCase() || '';
      const candTitle = candidate.title.toLowerCase();

      // Must match brand
      if (!candBrand || !sourceBrand || !candBrand.includes(sourceBrand.split(' ')[0])) {
        continue;
      }

      let confidence = 20; // Base for same brand
      let matchReason = 'Same brand';

      // Category match (smartphones, laptops, fashion, beauty)
      if (sourceCategory && candCategory && sourceCategory === candCategory) {
        confidence += 15;
        matchReason = `Same brand & category (${sourceCategory})`;

        // For fashion: Match color
        if ((sourceCategory.includes('fashion') || sourceCategory.includes('clothing')) && sourceColor) {
          const candColorMatch = candTitle.match(/\b(black|white|blue|red|green|yellow|pink|purple|grey|gray|silver|gold|rose|midnight|starlight|coral|velvet|ocean)\b/i);
          const candColor = candColorMatch ? candColorMatch[0].toLowerCase() : '';
          
          if (candColor === sourceColor) {
            confidence += 20;
            matchReason = `Same brand, category & color (${sourceColor})`;
          }
        }

        // For beauty: Match shade
        if (sourceCategory.includes('beauty') && sourceShade) {
          const candShadeMatch = candTitle.match(/\b(shade\s*)?(\d{1,3})\b|\b(fair|light|medium|dark|deep|ivory|beige|nude|natural)\b/i);
          const candShade = candShadeMatch ? candShadeMatch[0].toLowerCase() : '';
          
          if (candShade === sourceShade) {
            confidence += 25;
            matchReason = `Same brand, category & shade (${sourceShade})`;
          }
        }

        // For electronics: Match type keywords
        if (sourceCategory.includes('electronics') || sourceCategory.includes('smartphone') || sourceCategory.includes('laptop')) {
          const typeKeywords = ['pro', 'max', 'plus', 'lite', 'mini', 'ultra', 'air', '5g', '4g'];
          const sourceHasType = typeKeywords.some(kw => sourceTitle.includes(kw));
          const candHasType = typeKeywords.some(kw => candTitle.includes(kw));
          
          if (sourceHasType && candHasType) {
            const sourceType = typeKeywords.find(kw => sourceTitle.includes(kw));
            const candType = typeKeywords.find(kw => candTitle.includes(kw));
            if (sourceType === candType) {
              confidence += 10;
              matchReason += ` + similar type (${sourceType})`;
            }
          }
        }
      }

      // Only add if confidence is reasonable
      if (confidence >= 30) {
        matches.push({
          ...candidate,
          confidence,
          matchLevel: MatchLevel.SIMILAR,
          matchBadge: '🔗 SIMILAR',
          matchReason,
        });
      }
    }

    const filtered = matches
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 15); // Limit to top 15 similar products

    logger.info(`Found ${filtered.length} similar products`);
    return filtered;
  }
}

export const productMatcher = new ProductMatcher();
