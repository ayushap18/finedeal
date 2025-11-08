import './popup.css';
import { Product, MatchResult, ChromeMessage } from '@/types';
import { SITE_CONFIGS, getEnabledSites } from '@/config/sites';
import { productMatcher } from '@/services/matcher';
import { smartMatcher } from '@/services/smart-matcher'; // NEW: Smart matching logic
import { generateSearchQuery, generateSearchQueries, formatPrice, calculatePriceDiff } from '@/utils/product';
import { withTimeout } from '@/utils/helpers';
import { smartCache } from '@/utils/cache';
import { deduplicateProducts } from '@/utils/deduplication';
import { validatePrice } from '@/utils/price-validation';
import logger from '@/utils/logger';

/**
 * Popup Script - Main UI Controller
 */

// DOM Elements
const compareBtn = document.getElementById('compare-btn') as HTMLButtonElement;
const clearCacheBtn = document.getElementById('clear-cache-btn') as HTMLButtonElement;
const currentProductDiv = document.getElementById('current-product') as HTMLDivElement;
const resultsSection = document.getElementById('results-section') as HTMLDivElement;
const progressSection = document.getElementById('progress-section') as HTMLDivElement;
const progressText = document.getElementById('progress-text') as HTMLParagraphElement;
const statsSection = document.getElementById('stats-section') as HTMLDivElement;
const bestDealStat = document.getElementById('best-deal') as HTMLDivElement;
const totalSavingsStat = document.getElementById('total-savings') as HTMLDivElement;
const sitesSearchedStat = document.getElementById('sites-searched') as HTMLDivElement;

// State
let currentProduct: Product | null = null;
let isComparing = false;

/**
 * Initialize popup
 */
document.addEventListener('DOMContentLoaded', async () => {

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab.id) {
      showError('Unable to access current tab');
      return;
    }

    // Check if we're on a supported site
    const url = tab.url || '';
    const supportedSites = [
      'amazon.in', 'flipkart.com', 'myntra.com', 'snapdeal.com',
      'tatacliq.com', 'ajio.com', 'nykaa.com', 'croma.com', 'vijaysales.com'
    ];
    
    const isSupported = supportedSites.some(site => url.includes(site));
    
    if (!isSupported) {
      showError('Please visit a product page on a supported e-commerce site (Amazon, Flipkart, etc.)');
      return;
    }

    // Try to get current product
    try {
      const response = await sendMessage<Product>(tab.id, { type: 'GET_PRODUCT_INFO' });
      
      if (response && response.site !== 'unknown' && response.site !== 'error') {
        currentProduct = response;
        displayCurrentProduct(response);
        compareBtn.disabled = false;
      } else {
        showError('Please visit a product page on a supported e-commerce site');
      }
    } catch (msgError) {
      // Content script not loaded - show helpful message
      logger.warn('Content script not responding:', msgError);
      showError('Please refresh this page (F5) and try again. The extension needs to reload on this tab.');
    }
  } catch (error) {
    logger.error('Initialization error:', error);
    showError('Failed to initialize extension');
  }
});

/**
 * Display current product
 */
function displayCurrentProduct(product: Product) {
  const siteConfig = SITE_CONFIGS[product.site];
  
  currentProductDiv.innerHTML = `
    <div class="product-card">
      ${product.image ? `<img src="${product.image}" alt="Product" class="product-img">` : ''}
      <div class="product-info">
        <span class="site-badge ${siteConfig.badge}">${siteConfig.name}</span>
        <h3 class="product-title">${truncate(product.title, 100)}</h3>
        <p class="product-price">${product.price}</p>
      </div>
    </div>
  `;
}

/**
 * Compare button click handler
 */
compareBtn.addEventListener('click', async () => {
  if (!currentProduct || isComparing) return;

  isComparing = true;
  compareBtn.disabled = true;
  
  try {
    await startComparison(currentProduct);
  } catch (error) {
    logger.error('Comparison error:', error);
    showError('Failed to compare prices. Please try again.');
  } finally {
    isComparing = false;
    compareBtn.disabled = false;
  }
});

/**
 * Clear cache button click handler
 */
clearCacheBtn.addEventListener('click', async () => {
  try {
    await smartCache.clear();
    alert('Cache cleared! Next comparison will fetch fresh results.');
  } catch (error) {
    logger.error('Failed to clear cache:', error);
    alert('Failed to clear cache. Please try again.');
  }
});

/**
 * Start price comparison
 */
async function startComparison(product: Product) {
  logger.time('Comparison');

  // Show progress
  progressSection.classList.remove('hidden');
  resultsSection.innerHTML = '';

  // Generate multiple search queries with fallback strategies
  const searchQueries = generateSearchQueries(
    product.title, 
    product.brand, 
    product.productNumber, 
    product.productId, 
    product.url
  );

  // Get competitor sites
  const allSites = getEnabledSites();
  const competitorSites = allSites.filter((site) => site !== product.site);

  // OPTIMIZATION: Search sites in batches to reduce UI disruption
  // Open max 3 tabs at a time, then close before opening more
  const BATCH_SIZE = 3;
  const batches: string[][] = [];
  
  for (let i = 0; i < competitorSites.length; i += BATCH_SIZE) {
    batches.push(competitorSites.slice(i, i + BATCH_SIZE));
  }

  const validResults: Array<{ site: string; products: Product[]; successfulQuery: string }> = [];

  for (const batch of batches) {
    
    const batchPromises = batch.map((site) =>
      searchSiteWithFallback(site, searchQueries, competitorSites.length)
    );
    
    const batchResults = await Promise.all(batchPromises);
    
    // Filter and add successful results
    batchResults.forEach(result => {
      if (result !== null && result.products.length > 0) {
        validResults.push(result);
      }
    });
    
    // Small delay between batches to let Chrome clean up
    if (batch !== batches[batches.length - 1]) {
      await sleep(500);
    }
  }

  // Log detailed results
  validResults.forEach((result) => {
    logger.info(`${result.site}: ${result.products.length} products`);
  });

  // Collect all products
  const allProducts: Product[] = [];
  validResults.forEach((result) => {
    allProducts.push(...result.products);
  });

  // OPTIMIZATION: Deduplicate BEFORE matching (removes color variants early)
  const deduplicatedProducts = deduplicateProducts(allProducts);

  // Match products with NEW SMART MATCHER (v4.0)
  const allMatches: MatchResult[] = [];

  if (deduplicatedProducts.length > 0) {
    try {
      // USE SMART MATCHER: Multi-factor weighted scoring system
      const matches = await smartMatcher.findMatches(product, deduplicatedProducts);
      allMatches.push(...matches);

      // FALLBACK: If no matches with smart matcher, try old matcher
      if (allMatches.length === 0) {
        logger.info('🔄 Smart matcher found no results, trying fallback matcher...');
        const fallbackMatches = await productMatcher.findMatches(product, deduplicatedProducts);
        allMatches.push(...fallbackMatches);
        
        // Last resort: similar products
        if (allMatches.length === 0) {
          const similarMatches = await productMatcher.findSimilarProducts(product, deduplicatedProducts);
          allMatches.push(...similarMatches);
        }
      }

      // FINAL DEDUPLICATION: Keep only cheapest variant per site (safety net)
      const deduplicated = deduplicateColorVariants(allMatches);
      allMatches.length = 0; // Clear array
      allMatches.push(...deduplicated);
    } catch (error) {
      logger.error('Matching error:', error);
    }
  } else {
    logger.warn('No products scraped from any site');
  }

  logger.info(`Total matches: ${allMatches.length}`);

  // Hide progress
  progressSection.classList.add('hidden');

  // Display results (with similar products indicator if applicable)
  displayResults(product, allMatches, allMatches.length > 0 && allProducts.length > 0);

  logger.timeEnd('Comparison');
}

/**
 * Search site with multiple query fallback (PARALLEL STRATEGY + CACHING)
 */
async function searchSiteWithFallback(
  site: string,
  queries: string[],
  _totalSites: number
): Promise<{ site: string; products: Product[]; successfulQuery: string } | null> {
  const MIN_RESULTS = 2;
  const MAX_PARALLEL_QUERIES = 3; // Try top 3 queries in parallel

  // Try first 3 queries for cache check
  const priorityQueries = queries.slice(0, MAX_PARALLEL_QUERIES);

  // Check cache for all queries first (fast)
  for (const query of priorityQueries) {
    const cacheKey = smartCache.generateKey(site, query);
    const cachedResult = await smartCache.get<Product[]>(cacheKey);
    
    if (cachedResult && cachedResult.length > 0) {
      logger.info(`${site}: CACHE HIT`);
      return {
        site,
        products: cachedResult,
        successfulQuery: query
      };
    }
  }

  // PARALLEL STRATEGY: Try top 3 queries simultaneously
  
  const searchPromises = priorityQueries.map(async (query, index) => {
    try {
      const result = await searchSite(site, query, _totalSites);
      
      if (result && result.products.length >= MIN_RESULTS) {
        // Cache the results
        const cacheKey = smartCache.generateKey(site, query);
        await smartCache.set(cacheKey, result.products, 5 * 60 * 1000);
        
        return {
          site,
          products: result.products,
          successfulQuery: query,
          queryIndex: index
        };
      }
      return null;
    } catch (error) {
      return null;
    }
  });

  // Wait for first successful result or all to complete
  const results = await Promise.all(searchPromises);
  
  // Find first successful result (prefer earlier queries)
  const successfulResult = results.find(r => r !== null);
  
  if (successfulResult) {
    return {
      site: successfulResult.site,
      products: successfulResult.products,
      successfulQuery: successfulResult.successfulQuery
    };
  }

  // If parallel queries failed, try remaining queries sequentially
  const remainingQueries = queries.slice(MAX_PARALLEL_QUERIES, 5);
  
  for (let i = 0; i < remainingQueries.length; i++) {
    const query = remainingQueries[i];

    try {
      const cacheKey = smartCache.generateKey(site, query);
      const result = await searchSite(site, query, _totalSites);
      
      if (result && result.products.length > 0) {
        await smartCache.set(cacheKey, result.products, 5 * 60 * 1000);
        
        return { 
          site, 
          products: result.products,
          successfulQuery: query 
        };
      }
    } catch (error) {
      // Continue to next query
    }
  }

  return null;
}

/**
 * Search individual site (OPTIMIZED for speed)
 */
async function searchSite(
  site: string,
  query: string,
  _totalSites: number
): Promise<{ site: string; products: Product[] } | null> {
  const siteConfig = SITE_CONFIGS[site];
  
  updateProgress(`Searching ${siteConfig.name}...`);

  try {
    const searchUrl = siteConfig.searchUrl + encodeURIComponent(query);

    // Open tab in BACKGROUND (inactive, minimal visibility)
    const tab = await chrome.tabs.create({ 
      url: searchUrl, 
      active: false,
      selected: false, // Additional flag to ensure it stays in background
    });

    if (!tab.id) {
      return null;
    }

    // INCREASED wait times for better reliability across all sites
    await sleep(3500); // Increased from 2000ms to 3500ms for better page loading

    // Inject content script
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content-script.js'],
      });
    } catch (error) {
      await chrome.tabs.remove(tab.id);
      return null;
    }

    // SMART WAIT: Use intelligent page detection instead of fixed wait
    try {
      const readyResponse = await withTimeout(
        sendMessage<{ ready: boolean }>(tab.id, {
          type: 'WAIT_FOR_PAGE_READY',
        }),
        5000,
        `Page ready timeout for ${site}`
      );
      
      if (!readyResponse?.ready) {
        await sleep(1500);
      }
    } catch (error) {
      await sleep(1500);
    }

    // INCREASED timeout for slower sites
    const response = await withTimeout(
      sendMessage<{ site: string; products: Product[] }>(tab.id, {
        type: 'GET_SEARCH_RESULTS',
      }),
      8000, // Increased from 6000ms to 8000ms for better reliability
      `Timeout for ${site}`
    );

    // Close tab immediately
    await chrome.tabs.remove(tab.id);

    if (response && response.products && response.products.length > 0) {
      logger.info(`${site}: Found ${response.products.length} products`);
      return { site, products: response.products };
    }

    return null;
  } catch (error) {
    logger.error(`Search error for ${site}:`, error);
    return null;
  }
}

/**
 * Display results
 */
function displayResults(original: Product, matches: MatchResult[], hasSimilar: boolean = false) {
  // ADVANCED: Filter out unavailable products
  const availableMatches = matches.filter(m => m.availability !== 'out-of-stock');
  
  if (availableMatches.length < matches.length) {
    logger.info(`Filtered out ${matches.length - availableMatches.length} out-of-stock products`);
  }
  
  // Use available matches for display
  const displayMatches = availableMatches.length > 0 ? availableMatches : matches;
  
  if (displayMatches.length === 0) {
    statsSection.classList.add('hidden');
    resultsSection.innerHTML = `
      <div class="no-results">
        <div class="icon">🔍</div>
        <h3>No Matching Products Found</h3>
        <p>We searched across ${getEnabledSites().length - 1} major e-commerce sites</p>
        <div style="margin-top: 15px; padding: 15px; background: #f5f5f5; border-radius: 8px; text-align: left; font-size: 13px;">
          <strong>Possible reasons:</strong>
          <ul style="margin: 10px 0; padding-left: 20px;">
            <li>Product is exclusive to ${SITE_CONFIGS[original.site].name}</li>
            <li>Different product name on other sites</li>
            <li>Out of stock on competitor sites</li>
            <li>Recently launched product</li>
          </ul>
          <p style="margin-top: 10px;"><strong>Tip:</strong> Try searching manually on other sites!</p>
        </div>
      </div>
    `;
    return;
  }

  // Update stats dashboard
  const cheapest = displayMatches[0];
  const { diff, percent, isCheaper } = calculatePriceDiff(
    original.numericPrice,
    cheapest.numericPrice
  );
  
  const sitesFound = new Set(displayMatches.map(m => m.site)).size;
  
  statsSection.classList.remove('hidden');
  bestDealStat.textContent = SITE_CONFIGS[cheapest.site].name;
  totalSavingsStat.textContent = isCheaper ? `₹${diff}` : 'N/A';
  totalSavingsStat.style.color = isCheaper ? 'var(--green)' : 'var(--text-light)';
  sitesSearchedStat.textContent = `${sitesFound}/${getEnabledSites().length - 1}`;

  // Check if results are similar products (not exact matches)
  const allSimilar = displayMatches.every(m => m.matchLevel === 'SIMILAR');

  let html = '';

  // Similar products banner
  if (allSimilar) {
    html += `
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px; border-radius: 12px; margin-bottom: 20px; text-align: center;">
        <div style="font-size: 24px; margin-bottom: 5px;">🔗</div>
        <div style="font-weight: 600; font-size: 16px;">Similar Products Found</div>
        <div style="font-size: 13px; opacity: 0.9; margin-top: 5px;">
          Exact match not available. Showing similar products from <strong>${original.brand || 'same brand'}</strong>
        </div>
      </div>
    `;
  }

  // Savings banner (only for exact matches)
  if (!allSimilar && isCheaper && diff > 0) {
    html += `
      <div class="savings-banner">
        <div class="savings-amount">${formatPrice(diff)}</div>
        <div class="savings-text">Save ${percent}% on ${SITE_CONFIGS[cheapest.site].name}!</div>
      </div>
    `;
  }

  // Product cards
  displayMatches.slice(0, 10).forEach((match) => {
    const siteConfig = SITE_CONFIGS[match.site];
    const priceDiff = calculatePriceDiff(original.numericPrice, match.numericPrice);
    const isSimilar = match.matchLevel === 'SIMILAR';
    
    // PRICE VALIDATION: Check if price is suspicious
    const priceValidation = validatePrice(original.numericPrice, match.numericPrice);
    const showWarning = priceValidation.isSuspicious;
    
    // ADVANCED: Availability badge
    const availabilityBadge = match.availability === 'limited-stock' 
      ? '<span style="background: #FF9800; color: white; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600;">⚡ LIMITED</span>'
      : '';

    html += `
      <div class="result-card ${match.numericPrice === cheapest.numericPrice && !allSimilar ? 'best-price' : ''}">
        ${match.image ? `<img src="${match.image}" alt="Product" class="result-img">` : ''}
        <div class="result-info">
          <div class="result-header">
            <span class="site-badge ${siteConfig.badge}">${siteConfig.name}</span>
            ${match.numericPrice === cheapest.numericPrice && !allSimilar ? '<span class="best-badge">BEST PRICE</span>' : ''}
            ${isSimilar ? '<span style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600;">🔗 SIMILAR</span>' : ''}
            ${availabilityBadge}
            ${showWarning ? '<span style="background: #FFA500; color: white; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600;" title="' + priceValidation.reason + '">⚠️ SUSPICIOUS</span>' : ''}
          </div>
          <h4 class="result-title">${truncate(match.title, 80)}</h4>
          ${isSimilar ? `<p style="font-size: 12px; color: #666; margin: 5px 0;">${match.matchReason}</p>` : ''}
          ${showWarning ? `<p style="font-size: 12px; color: #FF6B00; margin: 5px 0; font-weight: 500;">⚠️ ${priceValidation.reason}</p>` : ''}
          <div class="result-pricing">
            <span class="result-price">${formatPrice(match.numericPrice)}</span>
            ${!allSimilar ? `<span class="price-diff ${priceDiff.isCheaper ? 'cheaper' : 'expensive'}">
              ${priceDiff.isCheaper ? '↓' : '↑'} ${priceDiff.percent}%
            </span>` : ''}
          </div>
          <div class="result-footer">
            <span class="confidence">Match: ${match.confidence}%</span>
            <div class="action-buttons">
              <button class="btn-view" data-url="${match.url}">View Deal</button>
              <button class="btn-copy" data-url="${match.url}" title="Copy link">📋</button>
            </div>
          </div>
        </div>
      </div>
    `;
  });

  resultsSection.innerHTML = html;

  // Add event listeners for View buttons
  document.querySelectorAll('.btn-view').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const url = (e.target as HTMLButtonElement).dataset.url;
      if (url) {
        chrome.tabs.create({ url });
      }
    });
  });

  // Add event listeners for Copy Link buttons
  document.querySelectorAll('.btn-copy').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const url = (e.target as HTMLButtonElement).dataset.url;
      if (url) {
        try {
          await navigator.clipboard.writeText(url);
          const button = e.target as HTMLButtonElement;
          const originalText = button.textContent;
          button.textContent = '✓ Copied!';
          button.style.background = 'var(--green)';
          setTimeout(() => {
            button.textContent = originalText;
            button.style.background = '';
          }, 2000);
        } catch (error) {
          logger.error('Failed to copy link:', error);
        }
      }
    });
  });
}

/**
 * Update progress
 */
function updateProgress(text: string) {
  progressText.textContent = text;
}

/**
 * Deduplicate color variants - keep only cheapest per site
 * Example: "iPhone 15 Black" and "iPhone 15 White" from same site → keep cheapest
 */
function deduplicateColorVariants(matches: MatchResult[]): MatchResult[] {
  const colorKeywords = [
    'black', 'white', 'blue', 'red', 'green', 'yellow', 'pink', 'purple',
    'grey', 'gray', 'silver', 'gold', 'rose', 'midnight', 'starlight', 
    'coral', 'velvet', 'ocean', 'space', 'titanium', 'natural', 'pro'
  ];

  // Group by site and base product (title without color)
  const groups = new Map<string, MatchResult[]>();

  matches.forEach(match => {
    // Remove color keywords from title to create base key
    let baseTitle = match.title.toLowerCase();
    colorKeywords.forEach(color => {
      baseTitle = baseTitle.replace(new RegExp(`\\b${color}\\b`, 'gi'), '').trim();
    });
    
    // Remove extra spaces
    baseTitle = baseTitle.replace(/\s+/g, ' ').trim();
    
    // Create unique key: site + brand + base title
    const key = `${match.site}|${match.brand}|${baseTitle}`;
    
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(match);
  });

  // Keep only cheapest from each group
  const deduplicated: MatchResult[] = [];
  groups.forEach((variants, key) => {
    if (variants.length === 1) {
      deduplicated.push(variants[0]);
    } else {
      // Multiple variants found - keep cheapest
      const cheapest = variants.reduce((min, curr) => 
        curr.numericPrice < min.numericPrice ? curr : min
      );
      logger.info(`Dedup: ${variants.length} color variants for "${key.split('|')[2]}" on ${variants[0].site} → keeping cheapest at ₹${cheapest.numericPrice}`);
      deduplicated.push(cheapest);
    }
  });

  return deduplicated;
}

/**
 * Show error message
 */
function showError(message: string) {
  const isRefreshNeeded = message.includes('refresh');
  
  currentProductDiv.innerHTML = `
    <div class="error">
      <div class="error-icon">${isRefreshNeeded ? '🔄' : '⚠️'}</div>
      <p style="margin-bottom: ${isRefreshNeeded ? '15px' : '0'};">${message}</p>
      ${isRefreshNeeded ? `
        <div style="margin-top: 10px; padding: 12px; background: #fff5f0; border-radius: 8px; border-left: 3px solid var(--orange);">
          <p style="font-size: 12px; margin: 0; color: #666;">
            <strong>Why?</strong> The extension loads when you install it, but existing tabs need a refresh to activate the price comparison features.
          </p>
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Send message to content script
 */
async function sendMessage<T>(tabId: number, message: ChromeMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, (response: T) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(response);
      }
    });
  });
}

/**
 * Utility: Sleep
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Utility: Truncate text
 */
function truncate(text: string, maxLength: number): string {
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}
