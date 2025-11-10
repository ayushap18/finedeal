import { SiteConfig } from '@/types';
/**
 * Site configurations with selectors
 */
export declare const SITE_CONFIGS: Record<string, SiteConfig>;
/**
 * Get enabled sites sorted by priority
 */
export declare function getEnabledSites(): string[];
/**
 * Get site config by hostname
 */
export declare function getSiteFromHostname(hostname: string): string | null;
//# sourceMappingURL=sites.d.ts.map