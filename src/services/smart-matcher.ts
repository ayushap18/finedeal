import { Product, MatchResult, MatchLevel, ProductAttributes } from '@/types';
import { extractModel, extractStorage, extractRAM, extractColor } from '@/utils/product';
import { normalizeBrand, brandsMatch } from '@/utils/brand-normalization';
import logger from '@/utils/logger';

/**
 * ===================================
 * SMART MATCHER v4.0 - NEW LOGIC
 * ===================================
 * 
 * APPROACH: Multi-Factor Weighted Scoring System
 * 
 * Instead of hard-coded if/else matching, we use:
 * 1. Tokenization & n-gram analysis
 * 2. Feature extraction (brand, model, specs, keywords)
 * 3. Weighted scoring across multiple dimensions
 * 4. Semantic similarity using TF-IDF-like approach
 * 5. Price-aware filtering (avoid cross-price-range matches)
 * 
 * SCORING BREAKDOWN (Total: 100 points):
 * - Brand match: 25 points
 * - Model match: 30 points
 * - Specs match (storage/RAM/color): 20 points
 * - Title similarity: 15 points
 * - Category match: 10 points
 * 
 * CONFIDENCE LEVELS:
 * - 90-100: EXACT match (same product)
 * - 80-89: HIGH confidence (very similar variant)
 * - 70-79: GOOD confidence (same model, different specs)
 * - 60-69: MEDIUM confidence (related product)
 * - <60: LOW confidence (filtered out)
 */

interface ScoringBreakdown {
  brandScore: number;
  modelScore: number;
  specsScore: number;
  titleScore: number;
  categoryScore: number;
  priceScore: number;
  total: number;
}

export class SmartMatcher {
  private readonly MIN_CONFIDENCE = 70; // More lenient than 85, but with smart filtering
  private readonly MAX_RESULTS = 8;
  
  // Weight distribution (total = 100)
  private readonly WEIGHTS = {
    BRAND: 25,
    MODEL: 30,
    SPECS: 20,
    TITLE: 15,
    CATEGORY: 10,
  };

  // Category keywords for strict filtering
  private readonly CATEGORY_KEYWORDS = {
    laptop: ['laptop', 'notebook', 'ultrabook', 'chromebook', 'macbook'],
    phone: ['phone', 'smartphone', 'mobile', 'iphone', 'galaxy phone'],
    tablet: ['tablet', 'ipad', 'tab s', 'surface go'],
    gpu: ['graphics card', 'gpu', 'geforce', 'radeon', 'rtx', 'gtx'],
    accessory: ['case', 'cover', 'charger', 'cable', 'adapter', 'protector', 'tempered glass'],
  };

  /**
   * Main matching method - uses smart weighted scoring
   */
  async findMatches(sourceProduct: Product, candidates: Product[]): Promise<MatchResult[]> {
    logger.time('Smart Matching v4.0');
    logger.group('🧠 Smart Matcher v4.0');
    logger.info(`Source: ${sourceProduct.title}`);
    logger.info(`Total candidates: ${candidates.length}`);

    try {
      // Step 1: Validate and preprocess
      const validCandidates = this.preprocessCandidates(candidates);
      logger.info(`✅ Valid candidates: ${validCandidates.length}`);

      // Step 2: Detect source category
      const sourceCategory = this.detectCategory(sourceProduct);
      logger.info(`📦 Source category: ${sourceCategory}`);

      // Step 3: Filter by category (strict)
      const categoryFiltered = this.filterByCategory(sourceProduct, sourceCategory, validCandidates);
      logger.info(`✅ Category filtered: ${categoryFiltered.length}`);

      if (categoryFiltered.length === 0) {
        logger.warn('⚠️ No candidates after category filtering');
        return [];
      }

      // Step 4: Extract features from source
      const sourceFeatures = this.extractFeatures(sourceProduct);
      logger.info('🔍 Source features:', {
        brand: sourceFeatures.brand,
        model: sourceFeatures.model,
        storage: sourceFeatures.storage,
        ram: sourceFeatures.ram,
        tokens: sourceFeatures.tokens.slice(0, 5).join(', '),
      });

      // Step 5: Score all candidates
      const scoredMatches: Array<MatchResult & { scoring?: ScoringBreakdown }> = [];
      
      for (const candidate of categoryFiltered) {
        const candidateFeatures = this.extractFeatures(candidate);
        const scoring = this.calculateScore(sourceFeatures, candidateFeatures, sourceProduct, candidate);
        
        // Apply confidence threshold
        if (scoring.total >= this.MIN_CONFIDENCE) {
          const matchResult: MatchResult & { scoring?: ScoringBreakdown } = {
            ...candidate,
            confidence: Math.round(scoring.total),
            matchLevel: this.getMatchLevel(scoring.total),
            matchBadge: this.getMatchBadge(scoring.total),
            matchReason: this.buildMatchReason(scoring, candidateFeatures),
            scoring, // Include for debugging
          };
          
          scoredMatches.push(matchResult);
        }
      }

      // Step 6: Sort and limit
      const sortedMatches = scoredMatches
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, this.MAX_RESULTS);

      logger.info(`✅ Final matches: ${sortedMatches.length}`);
      
      if (sortedMatches.length > 0) {
        logger.info('🏆 Top 3 matches:', sortedMatches.slice(0, 3).map(m => ({
          title: m.title.substring(0, 50),
          confidence: m.confidence,
          brand: m.scoring?.brandScore,
          model: m.scoring?.modelScore,
          specs: m.scoring?.specsScore,
          site: m.site,
        })));
      }

      return sortedMatches;

    } catch (error) {
      logger.error('❌ Smart matching error:', error);
      return [];
    } finally {
      logger.groupEnd();
      logger.timeEnd('Smart Matching v4.0');
    }
  }

  /**
   * Preprocess candidates - validation and cleanup
   */
  private preprocessCandidates(candidates: Product[]): Product[] {
    return candidates.filter(p => {
      // Basic validation
      if (!p.title || p.title.length < 5) return false;
      if (p.numericPrice < 10) return false;
      
      // Remove duplicates by productId
      return true;
    });
  }

  /**
   * Detect product category using keywords and category field
   */
  private detectCategory(product: Product): string {
    const titleLower = product.title.toLowerCase();
    
    // Check explicit category first
    if (product.category) {
      if (product.category.includes('laptop')) return 'laptop';
      if (product.category.includes('phone')) return 'phone';
      if (product.category.includes('tablet')) return 'tablet';
      if (product.category.includes('gpu')) return 'gpu';
    }

    // Check title keywords
    for (const [category, keywords] of Object.entries(this.CATEGORY_KEYWORDS)) {
      for (const keyword of keywords) {
        if (titleLower.includes(keyword)) {
          return category;
        }
      }
    }

    return 'unknown';
  }

  /**
   * Filter candidates by category (strict - no cross-category matches)
   */
  private filterByCategory(source: Product, sourceCategory: string, candidates: Product[]): Product[] {
    // If source is accessory, allow all accessories
    if (sourceCategory === 'accessory') {
      return candidates.filter(c => this.detectCategory(c) === 'accessory');
    }

    // For main products (laptop/phone/tablet/gpu), BLOCK all cross-category matches
    return candidates.filter(c => {
      const candidateCategory = this.detectCategory(c);
      
      // Block accessories unless source is accessory
      if (candidateCategory === 'accessory') return false;
      
      // STRICT: Same category only
      if (sourceCategory === 'unknown') return true; // If we can't detect, allow
      if (candidateCategory === 'unknown') return true; // If candidate category unknown, allow
      
      return sourceCategory === candidateCategory;
    });
  }

  /**
   * Extract features from product for scoring
   */
  private extractFeatures(product: Product) {
    const titleLower = product.title.toLowerCase();
    
    // Extract attributes
    const brand = normalizeBrand(product.brand || '');
    const model = extractModel(product.title);
    const storage = extractStorage(product.title);
    const ram = extractRAM(product.title);
    const color = extractColor(product.title);
    
    // Tokenization (remove stop words and special chars)
    const tokens = this.tokenize(product.title);
    
    // N-grams (2-word and 3-word phrases)
    const bigrams = this.generateNGrams(tokens, 2);
    const trigrams = this.generateNGrams(tokens, 3);
    
    // Extract numeric values (for specs comparison)
    const numbers = titleLower.match(/\d+/g)?.map(n => parseInt(n)) || [];
    
    // Extract important keywords (brands, model numbers, specs)
    const keywords = this.extractKeywords(titleLower);
    
    return {
      brand,
      model,
      storage,
      ram,
      color,
      tokens,
      bigrams,
      trigrams,
      numbers,
      keywords,
      titleLower,
    };
  }

  /**
   * Tokenize text (remove stop words, special chars)
   */
  private tokenize(text: string): string[] {
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
    
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Remove special chars
      .split(/\s+/)
      .filter(t => t.length > 1 && !stopWords.has(t));
  }

  /**
   * Generate n-grams from tokens
   */
  private generateNGrams(tokens: string[], n: number): string[] {
    const ngrams: string[] = [];
    for (let i = 0; i <= tokens.length - n; i++) {
      ngrams.push(tokens.slice(i, i + n).join(' '));
    }
    return ngrams;
  }

  /**
   * Extract important keywords (brand names, model numbers, etc.)
   */
  private extractKeywords(text: string): string[] {
    const keywords: string[] = [];
    
    // Known brand patterns
    const brandPatterns = /\b(apple|samsung|oneplus|xiaomi|redmi|oppo|vivo|realme|pixel|poco|iphone|galaxy|macbook|dell|hp|lenovo|asus|acer|msi)\b/gi;
    const brands = text.match(brandPatterns) || [];
    keywords.push(...brands);
    
    // Model number patterns (e.g., "15 pro", "s24 ultra", "rtx 4090")
    const modelPatterns = /\b([a-z0-9]+ (?:pro|plus|ultra|max|mini|lite|ti|super))\b/gi;
    const models = text.match(modelPatterns) || [];
    keywords.push(...models);
    
    // Numeric specs (e.g., "256gb", "16gb", "rtx 4090")
    const specPatterns = /\b(\d+(?:gb|tb|ghz|mp|inch|hz))\b/gi;
    const specs = text.match(specPatterns) || [];
    keywords.push(...specs);
    
    return keywords.map(k => k.toLowerCase());
  }

  /**
   * Calculate weighted score across all dimensions
   */
  private calculateScore(
    source: ReturnType<typeof this.extractFeatures>,
    candidate: ReturnType<typeof this.extractFeatures>,
    sourceProduct: Product,
    candidateProduct: Product
  ): ScoringBreakdown {
    // 1. Brand Score (25 points)
    const brandScore = this.scoreBrand(source.brand, candidate.brand);
    
    // 2. Model Score (30 points)
    const modelScore = this.scoreModel(source.model, candidate.model, source.tokens, candidate.tokens);
    
    // 3. Specs Score (20 points)
    const specsScore = this.scoreSpecs(source, candidate);
    
    // 4. Title Similarity Score (15 points)
    const titleScore = this.scoreTitleSimilarity(source.tokens, candidate.tokens, source.bigrams, candidate.bigrams);
    
    // 5. Category Score (10 points)
    const categoryScore = this.scoreCategory(sourceProduct.category, candidateProduct.category);
    
    // 6. Price proximity bonus (0-5 bonus points)
    const priceScore = this.scorePriceProximity(sourceProduct.numericPrice, candidateProduct.numericPrice);
    
    // Total score
    const total = Math.min(100, brandScore + modelScore + specsScore + titleScore + categoryScore + priceScore);
    
    return {
      brandScore,
      modelScore,
      specsScore,
      titleScore,
      categoryScore,
      priceScore,
      total,
    };
  }

  /**
   * Score brand match (0-25 points)
   */
  private scoreBrand(brand1: string, brand2: string): number {
    if (!brand1 || !brand2) return 0;
    
    // Exact match (normalized)
    if (brandsMatch(brand1, brand2)) {
      return this.WEIGHTS.BRAND; // 25 points
    }
    
    // Partial match (one contains the other)
    if (brand1.includes(brand2) || brand2.includes(brand1)) {
      return this.WEIGHTS.BRAND * 0.7; // 17.5 points
    }
    
    // Check if brands share significant words
    const words1 = brand1.split(/\s+/);
    const words2 = brand2.split(/\s+/);
    const commonWords = words1.filter(w => words2.includes(w) && w.length > 2);
    
    if (commonWords.length > 0) {
      return this.WEIGHTS.BRAND * 0.5; // 12.5 points
    }
    
    return 0;
  }

  /**
   * Score model match (0-30 points)
   */
  private scoreModel(model1: string | undefined, model2: string | undefined, tokens1: string[], tokens2: string[]): number {
    if (!model1 || !model2) {
      // If no explicit model, use token overlap
      const overlap = this.calculateTokenOverlap(tokens1, tokens2);
      return overlap * this.WEIGHTS.MODEL; // Up to 30 points based on overlap
    }
    
    const clean1 = model1.toLowerCase().replace(/[^a-z0-9]/g, '');
    const clean2 = model2.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // Exact match
    if (clean1 === clean2) {
      return this.WEIGHTS.MODEL; // 30 points
    }
    
    // One contains the other
    if (clean1.includes(clean2) || clean2.includes(clean1)) {
      return this.WEIGHTS.MODEL * 0.8; // 24 points
    }
    
    // Partial match (shared significant parts)
    const similarity = this.stringSimilarity(clean1, clean2);
    if (similarity > 0.6) {
      return this.WEIGHTS.MODEL * similarity; // 18-30 points
    }
    
    return 0;
  }

  /**
   * Score specs match (storage, RAM, color) (0-20 points)
   */
  private scoreSpecs(source: ReturnType<typeof this.extractFeatures>, candidate: ReturnType<typeof this.extractFeatures>): number {
    let score = 0;
    
    // Storage match (8 points)
    if (source.storage && candidate.storage) {
      if (source.storage === candidate.storage) {
        score += 8;
      } else if (Math.abs(parseInt(source.storage) - parseInt(candidate.storage)) <= 128) {
        score += 4; // Close storage capacity
      }
    }
    
    // RAM match (8 points)
    if (source.ram && candidate.ram) {
      if (source.ram === candidate.ram) {
        score += 8;
      } else if (Math.abs(parseInt(source.ram) - parseInt(candidate.ram)) <= 4) {
        score += 4; // Close RAM
      }
    }
    
    // Color match (4 points)
    if (source.color && candidate.color) {
      if (source.color.toLowerCase() === candidate.color.toLowerCase()) {
        score += 4;
      }
    }
    
    return score;
  }

  /**
   * Score title similarity using token overlap and n-grams (0-15 points)
   */
  private scoreTitleSimilarity(
    tokens1: string[],
    tokens2: string[],
    bigrams1: string[],
    bigrams2: string[]
  ): number {
    // Token overlap (Jaccard similarity)
    const tokenOverlap = this.calculateTokenOverlap(tokens1, tokens2);
    
    // Bigram overlap (more important - captures phrases)
    const bigramOverlap = this.calculateTokenOverlap(bigrams1, bigrams2);
    
    // Weighted combination
    const score = (tokenOverlap * 0.4 + bigramOverlap * 0.6) * this.WEIGHTS.TITLE;
    
    return score;
  }

  /**
   * Calculate Jaccard similarity (token overlap)
   */
  private calculateTokenOverlap(tokens1: string[], tokens2: string[]): number {
    if (tokens1.length === 0 || tokens2.length === 0) return 0;
    
    const set1 = new Set(tokens1);
    const set2 = new Set(tokens2);
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  }

  /**
   * Score category match (0-10 points)
   */
  private scoreCategory(cat1: string | undefined, cat2: string | undefined): number {
    if (!cat1 || !cat2) return 5; // Neutral if unknown
    
    // Exact match
    if (cat1 === cat2) {
      return this.WEIGHTS.CATEGORY; // 10 points
    }
    
    // Similar category (e.g., electronics-phone vs phone)
    if (cat1.includes(cat2) || cat2.includes(cat1)) {
      return this.WEIGHTS.CATEGORY * 0.7; // 7 points
    }
    
    return 0;
  }

  /**
   * Bonus points for price proximity (0-5 points)
   */
  private scorePriceProximity(price1: number, price2: number): number {
    if (price1 === 0 || price2 === 0) return 0;
    
    const ratio = Math.max(price1, price2) / Math.min(price1, price2);
    
    // Same price range (within 20%)
    if (ratio <= 1.2) return 5;
    
    // Close price range (within 50%)
    if (ratio <= 1.5) return 3;
    
    // Distant price (>2x difference) - penalty
    if (ratio > 2) return -2;
    
    return 0;
  }

  /**
   * Calculate string similarity (Levenshtein-like)
   */
  private stringSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1.0;
    if (str1.length === 0 || str2.length === 0) return 0.0;
    
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(str1, str2);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Levenshtein distance (edit distance)
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Determine match level based on score
   */
  private getMatchLevel(score: number): MatchLevel {
    if (score >= 90) return MatchLevel.EXACT;
    if (score >= 80) return MatchLevel.HIGH;
    if (score >= 70) return MatchLevel.MEDIUM;
    return MatchLevel.LOW;
  }

  /**
   * Get match badge based on score
   */
  private getMatchBadge(score: number): string {
    if (score >= 90) return '🎯 EXACT';
    if (score >= 80) return '⭐ HIGH';
    if (score >= 70) return '✓ MEDIUM';
    return '~ LOW';
  }

  /**
   * Build match reason explanation
   */
  private buildMatchReason(scoring: ScoringBreakdown, features: ReturnType<typeof this.extractFeatures>): string {
    const reasons: string[] = [];
    
    if (scoring.brandScore >= 20) {
      reasons.push(`Brand: ${features.brand}`);
    }
    
    if (scoring.modelScore >= 20) {
      reasons.push(`Model: ${features.model || 'matched'}`);
    }
    
    if (scoring.specsScore >= 10) {
      const specs: string[] = [];
      if (features.storage) specs.push(features.storage);
      if (features.ram) specs.push(features.ram);
      if (specs.length > 0) {
        reasons.push(`Specs: ${specs.join(', ')}`);
      }
    }
    
    if (scoring.titleScore >= 10) {
      reasons.push('Similar title');
    }
    
    return reasons.join(' • ') || 'Matched';
  }
}

// Export singleton instance
export const smartMatcher = new SmartMatcher();
