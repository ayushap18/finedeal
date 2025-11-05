import { Product, ScrapedProduct, ChromeMessage } from '@/types';
import { getSiteFromHostname, SITE_CONFIGS } from '@/config/sites';
import { parsePrice, extractBrand, detectCategory } from '@/utils/product';
import logger from '@/utils/logger';

/**
 * Content Script - Runs on e-commerce site pages
 * Handles product extraction and search results scraping
 */

logger.info('FineDeal Content Script Loaded');

/**
 * Smart wait for element to appear (no fixed delays!)
 */
function waitForElement(selector: string, timeout = 5000): Promise<Element | null> {
  return new Promise((resolve) => {
    const element = document.querySelector(selector);
    if (element) {
      logger.debug(`Element ${selector} already present`);
      return resolve(element);
    }
    
    const observer = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (el) {
        observer.disconnect();
        logger.debug(`Element ${selector} appeared after observation`);
        resolve(el);
      }
    });
    
    observer.observe(document.body, { 
      childList: true, 
      subtree: true,
      attributes: false,
      characterData: false
    });
    
    setTimeout(() => { 
      observer.disconnect();
      logger.warn(`Timeout waiting for ${selector}`);
      resolve(null);
    }, timeout);
  });
}

/**
 * Wait for page to be fully loaded and rendered
 */
async function waitForPageReady(selectors: string[], timeout = 6000): Promise<boolean> {
  logger.debug('Waiting for page to be ready...');
  
  // Wait for any of the selectors to appear
  const promises = selectors.map(selector => waitForElement(selector, timeout));
  const result = await Promise.race(promises);
  
  if (result) {
    logger.info('Page ready - key elements found');
    return true;
  }
  
  logger.warn('Page ready timeout - proceeding anyway');
  return false;
}

// Message listener
chrome.runtime.onMessage.addListener(
  (request: ChromeMessage, _sender, sendResponse) => {
    logger.debug('Message received:', request.type);

    if (request.type === 'GET_PRODUCT_INFO') {
      handleGetProductInfo(sendResponse);
      return true; // Keep channel open for async response
    }

    if (request.type === 'GET_SEARCH_RESULTS') {
      handleGetSearchResults(sendResponse);
      return true;
    }

    if (request.type === 'WAIT_FOR_PAGE_READY') {
      handleWaitForPageReady(sendResponse);
      return true;
    }

    return false;
  }
);

/**
 * Wait for page to be ready with smart detection
 */
async function handleWaitForPageReady(sendResponse: (response: { ready: boolean }) => void) {
  try {
    const hostname = window.location.hostname;
    const site = getSiteFromHostname(hostname);
    
    if (!site) {
      sendResponse({ ready: false });
      return;
    }
    
    const config = SITE_CONFIGS[site];
    const selectors = [
      ...config.selectors.searchPage.container,
      ...config.selectors.searchPage.price
    ];
    
    const ready = await waitForPageReady(selectors);
    sendResponse({ ready });
  } catch (error) {
    logger.error('Error waiting for page ready:', error);
    sendResponse({ ready: false });
  }
}

/**
 * Get current product information
 */
function handleGetProductInfo(sendResponse: (response: Product) => void) {
  try {
    const hostname = window.location.hostname;
    const site = getSiteFromHostname(hostname);

    if (!site) {
      sendResponse({
        site: 'unknown',
        title: 'Please visit a supported e-commerce site',
        price: '',
        numericPrice: 0,
        url: '',
        image: '',
        productId: '',
        brand: '',
        category: '',
      });
      return;
    }

    const product = extractProductInfo(site);
    logger.info('Product extracted:', product.title);
    sendResponse(product);
  } catch (error) {
    logger.error('Error extracting product info:', error);
    sendResponse({
      site: 'error',
      title: 'Error extracting product information',
      price: '',
      numericPrice: 0,
      url: '',
      image: '',
      productId: '',
      brand: '',
      category: '',
    });
  }
}

/**
 * Get search results from current page
 */
function handleGetSearchResults(
  sendResponse: (response: { site: string; products: ScrapedProduct[] }) => void
) {
  try {
    const hostname = window.location.hostname;
    const site = getSiteFromHostname(hostname);

    if (!site) {
      sendResponse({ site: hostname, products: [] });
      return;
    }

    const products = scrapeSearchResults(site);
    logger.info(`Scraped ${products.length} products from ${site}`);
    sendResponse({ site, products });
  } catch (error) {
    logger.error('Error scraping search results:', error);
    sendResponse({ site: 'error', products: [] });
  }
}

/**
 * Extract product information from page
 */
function extractProductInfo(site: string): Product {
  const config = SITE_CONFIGS[site];
  const url = window.location.href;

  const title = getElementText(config.selectors.productPage.title) || 'Product not found';
  const priceText = getElementText(config.selectors.productPage.price) || '';
  const image = getImageSrc(config.selectors.productPage.image) || '';
  const productId = getAttributeValue(config.selectors.productPage.productId, 'data-asin') ||
                    getAttributeValue(config.selectors.productPage.productId, 'data-id') || '';
  
  const brandText = config.selectors.productPage.brand
    ? getElementText(config.selectors.productPage.brand)
    : '';

  return {
    site,
    title,
    price: priceText,
    numericPrice: parsePrice(priceText),
    url,
    image,
    productId,
    brand: brandText || extractBrand(title),
    category: detectCategory(title),
  };
}

/**
 * Scrape search results from page (OPTIMIZED for speed)
 */
function scrapeSearchResults(site: string): ScrapedProduct[] {
  const config = SITE_CONFIGS[site];
  const products: ScrapedProduct[] = [];

  // OPTIMIZATION 1: Try most common selector first, then fallback
  let containers: NodeListOf<Element> | null = null;
  for (const selector of config.selectors.searchPage.container) {
    containers = document.querySelectorAll(selector);
    if (containers && containers.length > 0) {
      logger.debug(`Found ${containers.length} containers with selector: ${selector}`);
      break;
    }
  }

  if (!containers || containers.length === 0) {
    logger.warn(`No product containers found on page for ${site}`);
    return products;
  }

  logger.info(`Scraping ${containers.length} products from ${site}`);

  // OPTIMIZATION 2: Limit to 20 products instead of 30 (faster scraping & matching)
  const limit = Math.min(20, containers.length);

  for (let index = 0; index < limit; index++) {
    const container = containers[index];
    
    try {
      const titleEl = container.querySelector(
        config.selectors.searchPage.title.join(',')
      );
      const priceEl = container.querySelector(
        config.selectors.searchPage.price.join(',')
      );
      const imageEl = container.querySelector(
        config.selectors.searchPage.image.join(',')
      ) as HTMLImageElement;
      const linkEl = container.querySelector(
        config.selectors.searchPage.link.join(',')
      ) as HTMLAnchorElement;

      if (!titleEl || !priceEl) {
        logger.debug(`Skipping container ${index}: missing title or price`);
        continue;
      }

      const title = titleEl.textContent?.trim() || '';
      const priceText = priceEl.textContent?.trim() || '';
      
      if (!title || !priceText) {
        logger.debug(`Skipping container ${index}: empty title or price`);
        continue;
      }

      const numericPrice = parsePrice(priceText);
      if (numericPrice < 10) {
        logger.debug(`Skipping container ${index}: invalid price ${numericPrice} from "${priceText}"`);
        continue;
      }

      const image = imageEl?.src || imageEl?.getAttribute('data-src') || imageEl?.getAttribute('data-lazy-src') || '';
      const url = linkEl?.href || '';
      
      if (!url) {
        logger.debug(`Skipping container ${index}: no URL found`);
        continue;
      }
      
      const productId = config.selectors.searchPage.productId
        ? getAttributeValueFrom(container, config.selectors.searchPage.productId, 'data-asin') ||
          getAttributeValueFrom(container, config.selectors.searchPage.productId, 'data-id') || ''
        : '';

      products.push({
        site,
        title,
        price: priceText,
        numericPrice: parsePrice(priceText),
        url: url.startsWith('http') ? url : `https://${window.location.hostname}${url}`,
        image,
        productId,
        brand: extractBrand(title),
        category: detectCategory(title),
      });
    } catch (error) {
      logger.debug(`Error scraping product at index ${index}:`, error);
    }
  }

  return products;
}

/**
 * Utility: Get text content from element using selectors
 */
function getElementText(selectors: string[]): string {
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element?.textContent) {
      return element.textContent.trim();
    }
  }
  return '';
}

/**
 * Utility: Get image src from element using selectors
 */
function getImageSrc(selectors: string[]): string {
  for (const selector of selectors) {
    const element = document.querySelector(selector) as HTMLImageElement;
    if (element) {
      return element.src || element.getAttribute('data-src') || '';
    }
  }
  return '';
}

/**
 * Utility: Get attribute value from element
 */
function getAttributeValue(selectors: string[], attribute: string): string {
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      return element.getAttribute(attribute) || '';
    }
  }
  return '';
}

/**
 * Utility: Get attribute value from container
 */
function getAttributeValueFrom(
  container: Element,
  selectors: string[],
  attribute: string
): string {
  for (const selector of selectors) {
    const element = container.querySelector(selector);
    if (element) {
      return element.getAttribute(attribute) || '';
    }
  }
  return container.getAttribute(attribute) || '';
}
