import { SiteConfig } from '@/types';

/**
 * Site configurations with selectors
 */
export const SITE_CONFIGS: Record<string, SiteConfig> = {
  amazon: {
    name: 'Amazon',
    badge: 'amazon-badge',
    searchUrl: 'https://www.amazon.in/s?k=',
    enabled: true,
    priority: 1,
    selectors: {
      productPage: {
        title: ['#productTitle', 'h1.product-title', 'span#productTitle'],
        price: ['.a-price-whole', '.a-price .a-offscreen', 'span.a-price-whole', '.a-price-range .a-price .a-offscreen'],
        image: ['#landingImage', '.a-dynamic-image', 'img#landingImage'],
        productId: ['[data-asin]'],
        brand: ['#bylineInfo', '.a-size-base.po-break-word', 'a#bylineInfo'],
      },
      searchPage: {
        container: ['div[data-component-type="s-search-result"]', 'div[data-asin]:not([data-asin=""])'],
        title: ['h2 a span', 'h2 span.a-text-normal', '.a-text-normal', 'h2.a-size-mini span'],
        price: ['.a-price-whole', 'span.a-price-whole', '.a-price .a-offscreen'],
        image: ['img.s-image', 'img[data-image-latency]'],
        link: ['h2 a', 'a.a-link-normal.s-no-outline'],
        productId: ['[data-asin]'],
      },
    },
  },
  flipkart: {
    name: 'Flipkart',
    badge: 'flipkart-badge',
    searchUrl: 'https://www.flipkart.com/search?q=',
    enabled: true,
    priority: 2,
    selectors: {
      productPage: {
        title: ['span.VU-ZEz', '.VU-ZEz', '.B_NuCI', 'h1.B_NuCI', 'span.B_NuCI', 'h1', '[class*="title"]'],
        price: ['div.Nx9bqj.CxhGGd', '.Nx9bqj.CxhGGd', 'div.Nx9bqj', '.Nx9bqj', '._30jeq3', '._16Jk6d', '[class*="price"]'],
        image: ['._396cs4', '._53J4C- img', '.CXW8mj img', '._396cs4 img', 'img[class*="image"]'],
        productId: ['[data-id]', '[data-tkid]', '[data-product-id]'],
        brand: ['span._1Us2sh', '._1Us2sh', '.fMghEO span', '.fMghEO'],
      },
      searchPage: {
        container: ['div[data-id]', '._1AtVbE', '._13oc-S', 'div._1xHGtK', '[class*="product"]'],
        title: ['.KzDlHZ', 'a.KzDlHZ', '.s1Q9rs', 'a.s1Q9rs', '._2WkVRV', 'a.IRpwTa', '[class*="title"]'],
        price: ['.Nx9bqj', 'div.Nx9bqj', '._30jeq3', 'div._30jeq3', '._3tbKJL', '[class*="price"]'],
        image: ['img._2r_T1I', 'img._396cs4', 'img[class*="image"]', 'img'],
        link: ['a._1fQZEK', 'a.s1Q9rs', 'a._2rpwqI', 'a.IRpwTa', 'a[href*="/p/"]', 'a'],
      },
    },
  },
  myntra: {
    name: 'Myntra',
    badge: 'myntra-badge',
    searchUrl: 'https://www.myntra.com/search?q=',
    enabled: false, // Temporarily disabled - needs better selectors
    priority: 3,
    selectors: {
      productPage: {
        title: ['.pdp-title', '.pdp-name', 'h1.pdp-name', 'h1.pdp-title', '[class*="pdp-title"]', '[class*="pdp-name"]', 'h1'],
        price: ['.pdp-price', '.pdp-price strong', 'span.pdp-price', '.pdp-mrp', '[class*="pdp-price"]', '[class*="pdp-mrp"]'],
        image: ['.image-grid-image', 'img.image-grid-image', '.pdp-image', 'img[class*="image-grid"]', 'img'],
        productId: ['[data-productid]', '[data-product-id]', '[data-skuid]'],
        brand: ['.pdp-title', '.pdp-brand', 'h1.pdp-brand', '[class*="brand"]', '[class*="pdp-brand"]'],
      },
      searchPage: {
        container: ['.product-base', 'li.product-base', '.product-productMetaInfo', '[class*="product-base"]', 'li[class*="product"]'],
        title: ['.product-brand', '.product-product', '.product-productMetaInfo h3', 'h3.product-brand', 'h4.product-product', '[class*="product-brand"]'],
        price: ['.product-discountedPrice', '.product-price', 'span.product-discountedPrice', 'div.product-price', '[class*="discounted"]', '[class*="price"]'],
        image: ['img.img-responsive', 'img[class*="img-responsive"]', 'picture img', 'img'],
        link: ['a', 'a[href*="/"]', '[class*="product"] a'],
        productId: ['[data-productid]', '[data-product-id]', '[data-skuid]'],
      },
    },
  },
  snapdeal: {
    name: 'Snapdeal',
    badge: 'snapdeal-badge',
    searchUrl: 'https://www.snapdeal.com/search?keyword=',
    enabled: true,
    priority: 4,
    selectors: {
      productPage: {
        title: ['.pdp-e-i-head', 'h1.pdp-e-i-head', '.title-section h1', '[itemprop="name"]', 'h1', '[class*="pdp-e-i-head"]'],
        price: ['.pdp-final-price', '.payBlkBig', 'span.payBlkBig', '.pdp-e-i-price', '[class*="final-price"]', '[class*="payBlk"]'],
        image: ['#bx-img', 'img#bx-img', '.mainImageWrapper img', '.product-image img', 'img[itemprop="image"]', 'img'],
        productId: ['[data-productid]', '[data-product-id]', '[id*="product"]', '[data-pid]'],
        brand: ['[itemprop="brand"]', '.h2', '.pdp-e-i-brand', '[class*="brand"]'],
      },
      searchPage: {
        container: ['.product-tuple-listing', 'div.product-tuple-listing', '.col-xs-6', '[class*="product-tuple"]', '.product'],
        title: ['.product-title', 'p.product-title', '.prodName', '[title]', '[class*="title"]'],
        price: ['.product-price', 'span.product-price', '.lfloat', '[class*="price"]'],
        image: ['img.product-image', 'source[srcset]', 'picture img', 'img'],
        link: ['a[href*="/product/"]', 'a.dp-widget-link', '.product-tuple-listing a', 'a'],
        productId: ['[data-productid]', '[data-product-id]', '[id*="product"]', '[data-pid]'],
      },
    },
  },
  tatacliq: {
    name: 'Tata CLiQ',
    badge: 'tatacliq-badge',
    searchUrl: 'https://www.tatacliq.com/search/?searchCategory=all&text=',
    enabled: true,
    priority: 5,
    selectors: {
      productPage: {
        title: ['h1.ProductDetailsMainCard__productName', '.ProductDetailsMainCard__productName', '[class*="productName"]', 'h1', '[class*="title"]'],
        price: ['.ProductDetailsMainCard__price', 'span.ProductDetailsMainCard__price', '[class*="price"]'],
        image: ['.ProductDetailsMainCard__productImage', 'img[class*="productImage"]', 'picture img', 'img'],
        productId: ['[data-productid]', '[data-product-id]', '[data-sku]'],
        brand: ['.ProductDetailsMainCard__brandName', '[class*="brandName"]', '[class*="brand"]'],
      },
      searchPage: {
        container: ['.ProductModule__base', 'div[class*="ProductModule"]', '.SearchModule__listingContainer > div', '[class*="product"]'],
        title: ['.ProductModule__productTitle', '.ProductDescription__title', '[class*="productTitle"]', 'h2', 'h3'],
        price: ['.ProductDescription__priceHolder', '.ProductPrice__price', '[class*="price"]', 'span[class*="price"]'],
        image: ['img[class*="ProductModule"]', 'picture img', 'img'],
        link: ['a[href*="/"]', 'a[class*="ProductModule"]', 'a'],
        productId: ['[data-productid]', '[data-product-id]', '[data-sku]'],
      },
    },
  },
  ajio: {
    name: 'Ajio',
    badge: 'ajio-badge',
    searchUrl: 'https://www.ajio.com/search/?text=',
    enabled: true,
    priority: 6,
    selectors: {
      productPage: {
        title: ['.prod-title', 'h1.prod-title', '.pdp-title', '[class*="prod-title"]', 'h1'],
        price: ['.prod-sp', 'span.prod-sp', '.prod-price', '[class*="prod-sp"]', '[class*="price"]'],
        image: ['.prod-image-container img', 'img[class*="prod-image"]', 'picture img', 'img'],
        productId: ['[data-productid]', '[data-product-code]', '[data-sku]'],
        brand: ['.prod-brand', 'span[class*="brand"]', '[class*="brand"]'],
      },
      searchPage: {
        container: ['.item', '.rilrtl-products-list__item', 'div[class*="item"]', '[class*="product"]'],
        title: ['.nameCls', '.name', '.product-name', 'div[class*="name"]', '[class*="title"]'],
        price: ['.price', 'span.price', '[class*="discounted"]', '[class*="price"]'],
        image: ['img[class*="img"]', 'picture img', 'img'],
        link: ['a[href*="/p/"]', 'a[class*="product"]', 'a'],
        productId: ['[data-productid]', '[data-product-code]', '[data-sku]'],
      },
    },
  },
  nykaa: {
    name: 'Nykaa',
    badge: 'nykaa-badge',
    searchUrl: 'https://www.nykaa.com/search/result/?q=',
    enabled: true,
    priority: 7,
    selectors: {
      productPage: {
        title: ['.product-title', 'h1[class*="product"]', 'h1', '[class*="title"]'],
        price: ['.product-price', 'span[class*="price"]', '[class*="offer-price"]', '[class*="price"]'],
        image: ['.product-image', 'img[class*="product"]', 'picture img', 'img'],
        productId: ['[data-productid]', '[data-product-id]', '[data-id]'],
        brand: ['.product-brand', '[class*="brand"]'],
      },
      searchPage: {
        container: ['.css-xrzmfa', '.productWrapper', 'div[class*="product"]', 'article'],
        title: ['.css-1jnyxt6', 'h2', '[class*="title"]', 'span[class*="title"]'],
        price: ['.css-111z9ua', 'span[class*="price"]', '[class*="price"]'],
        image: ['img[class*="css"]', 'picture img', 'img'],
        link: ['a[href*="/"]', 'a'],
        productId: ['[data-productid]', '[data-product-id]', '[data-id]'],
      },
    },
  },
  croma: {
    name: 'Croma',
    badge: 'croma-badge',
    searchUrl: 'https://www.croma.com/searchB?q=',
    enabled: true,
    priority: 8,
    selectors: {
      productPage: {
        title: ['.pd-title', 'h1[class*="title"]', 'h1', '[class*="product-title"]'],
        price: ['.amount', 'span.amount', '.new-price', '[class*="price"]', '[class*="amount"]'],
        image: ['.product-image', 'img[class*="product"]', 'picture img', 'img'],
        productId: ['[data-product-id]', '[data-productid]', '[data-sku]'],
        brand: ['.pd-brand', '[class*="brand"]'],
      },
      searchPage: {
        container: ['.product-item', '.plp-card', 'div[class*="product"]', 'article'],
        title: ['.product-title', 'h3', '[class*="title"]'],
        price: ['.amount', '.new-price', 'span[class*="price"]', '[class*="price"]'],
        image: ['img[class*="product"]', 'picture img', 'img'],
        link: ['a[href*="/"]', 'a'],
        productId: ['[data-product-id]', '[data-productid]', '[data-sku]'],
      },
    },
  },
  vijaysales: {
    name: 'Vijay Sales',
    badge: 'vijaysales-badge',
    searchUrl: 'https://www.vijaysales.com/search/',
    enabled: true,
    priority: 9,
    selectors: {
      productPage: {
        title: ['.product-name', 'h1[class*="product"]', 'h1', '[class*="title"]'],
        price: ['.price', 'span.price', '.regular-price', '[class*="price"]'],
        image: ['.product-image', 'img[class*="product"]', 'picture img', 'img'],
        productId: ['[data-product-id]', '[data-productid]', '[data-sku]'],
        brand: ['.product-brand', '[class*="brand"]'],
      },
      searchPage: {
        container: ['.product-item', '.product-layout', '.product-thumb', 'div[class*="product"]', 'article'],
        title: ['.product-name', 'h4', '[class*="name"]', '[class*="title"]'],
        price: ['.price-new', '.price', 'span[class*="price"]', '[class*="price"]'],
        image: ['img[class*="img"]', 'picture img', 'img'],
        link: ['a[href*="/"]', 'a'],
        productId: ['[data-product-id]', '[data-productid]', '[data-sku]'],
      },
    },
  },
};

/**
 * Get enabled sites sorted by priority
 */
export function getEnabledSites(): string[] {
  return Object.entries(SITE_CONFIGS)
    .filter(([_, config]) => config.enabled)
    .sort((a, b) => a[1].priority - b[1].priority)
    .map(([key]) => key);
}

/**
 * Get site config by hostname
 */
export function getSiteFromHostname(hostname: string): string | null {
  for (const [key] of Object.entries(SITE_CONFIGS)) {
    if (hostname.includes(key)) {
      return key;
    }
  }
  return null;
}
