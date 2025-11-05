import { ChromeMessage, AnalyticsEvent, PerformanceMetrics } from '@/types';
import { cache } from '@/services/cache';
import logger from '@/utils/logger';

/**
 * Background Service Worker
 * Handles background tasks, analytics, and coordination
 */

logger.info('FineDeal Service Worker Started');

// Analytics tracking
const analytics: AnalyticsEvent[] = [];

// Rate limiting
const rateLimits = new Map<string, number>();

/**
 * Installation event
 */
chrome.runtime.onInstalled.addListener((details) => {
  logger.info('Extension installed:', details.reason);
  
  if (details.reason === 'install') {
    // First install
    chrome.storage.local.set({
      version: '1.0.0',
      installDate: Date.now(),
      stats: {
        comparisons: 0,
        productsSaved: 0,
      },
    });
  } else if (details.reason === 'update') {
    // Update
    logger.info(`Updated to version 1.0.0`);
  }
});

/**
 * Message handling
 */
chrome.runtime.onMessage.addListener((
  request: ChromeMessage,
  sender,
  _sendResponse
) => {
  logger.debug('Background message:', request.type);

  // Handle different message types
  switch (request.type) {
    case 'START_COMPARISON':
      handleStartComparison(sender.tab?.id, request.data);
      break;
      
    default:
      logger.warn('Unknown message type:', request.type);
  }

  return true;
});

/**
 * Handle comparison start
 */
async function handleStartComparison(tabId: number | undefined, data: any) {
  if (!tabId) return;

  logger.info('Starting comparison for tab:', tabId);

  // Track analytics
  trackEvent('comparison_started', { tabId, product: data?.title });

  // Update stats
  updateStats('comparisons');
}

/**
 * Track analytics event
 */
function trackEvent(event: string, data?: Record<string, any>) {
  const analyticsEvent: AnalyticsEvent = {
    event,
    timestamp: Date.now(),
    data,
  };

  analytics.push(analyticsEvent);
  logger.debug('Analytics event:', analyticsEvent);

  // Keep only last 1000 events
  if (analytics.length > 1000) {
    analytics.shift();
  }
}

/**
 * Update usage statistics
 */
async function updateStats(key: string) {
  const result = await chrome.storage.local.get(['stats']);
  const stats = result.stats || {};
  
  stats[key] = (stats[key] || 0) + 1;
  
  await chrome.storage.local.set({ stats });
}

/**
 * Check rate limit
 */
function checkRateLimit(site: string, limitPerMinute = 10): boolean {
  const now = Date.now();
  const key = `${site}_${Math.floor(now / 60000)}`; // Per minute
  
  const count = rateLimits.get(key) || 0;
  
  if (count >= limitPerMinute) {
    logger.warn(`Rate limit exceeded for ${site}`);
    return false;
  }
  
  rateLimits.set(key, count + 1);
  
  // Cleanup old entries
  if (rateLimits.size > 100) {
    const entries = Array.from(rateLimits.entries());
    entries.slice(0, 50).forEach(([k]) => rateLimits.delete(k));
  }
  
  return true;
}

/**
 * Performance monitoring
 */
function logPerformanceMetrics(metrics: PerformanceMetrics) {
  logger.info('Performance Metrics:', {
    totalTime: `${metrics.totalTime}ms`,
    scrapeTime: `${metrics.scrapeTime}ms`,
    matchTime: `${metrics.matchTime}ms`,
    sitesSearched: metrics.sitesSearched,
    productsFound: metrics.productsFound,
    matchesFound: metrics.matchesFound,
  });

  // Track in analytics
  trackEvent('performance', metrics);
}

/**
 * Clear cache periodically
 */
setInterval(() => {
  cache.clear();
  logger.debug('Cache cleared (periodic)');
}, 3600000); // Every hour

// Export for testing
export { trackEvent, checkRateLimit, logPerformanceMetrics };
