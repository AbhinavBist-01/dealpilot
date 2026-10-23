/**
 * DealPilot Shopping Assistant — Content Script
 * 
 * Detects supported Indian shopping sites (Amazon, Flipkart, Croma, Blinkit, Zepto)
 * extracts canonical product data, communicates with the background service worker,
 * and renders the floating DealPilot Deal Radar widget on the page.
 */

export interface ExtractedProductInfo {
  url: string;
  title: string;
  price: number;
  mrp?: number;
  domain: string;
  merchantName: string;
  imageUrl?: string;
  inStock: boolean;
}

// Supported Indian Shopping Domains
const SUPPORTED_DOMAINS = [
  'amazon.in',
  'flipkart.com',
  'croma.com',
  'reliancedigital.in',
  'tatacliq.com',
  'blinkit.com',
  'zeptonow.com',
  'swiggy.com',
];

/**
 * Detects if current page is a supported Indian retail / quick commerce product page
 */
export function isSupportedShoppingPage(hostname: string): boolean {
  return SUPPORTED_DOMAINS.some((domain) => hostname.includes(domain));
}

/**
 * Extracts product metadata using optimized DOM selectors for each store
 */
export function extractProductInformation(): ExtractedProductInfo | null {
  const host = window.location.hostname.toLowerCase();
  if (!isSupportedShoppingPage(host)) return null;

  let title = '';
  let price = 0;
  let mrp: number | undefined = undefined;
  let imageUrl = '';
  let inStock = true;
  let merchantName = 'Indian Retailer';

  // 1. Amazon India
  if (host.includes('amazon.in')) {
    merchantName = 'Amazon India';
    const titleEl = document.querySelector('#productTitle') || document.querySelector('#title');
    title = titleEl?.textContent?.trim() || '';

    const priceEl =
      document.querySelector('.a-price .a-price-whole') ||
      document.querySelector('#priceblock_ourprice') ||
      document.querySelector('#priceblock_dealprice');
    if (priceEl) {
      const cleanText = priceEl.textContent?.replace(/[^0-9]/g, '') || '';
      price = parseInt(cleanText, 10);
    }

    const mrpEl = document.querySelector('.a-text-price .a-offscreen');
    if (mrpEl) {
      mrp = parseInt(mrpEl.textContent?.replace(/[^0-9]/g, '') || '', 10);
    }

    const imgEl = document.querySelector('#landingImage') as HTMLImageElement;
    imageUrl = imgEl?.src || '';
  }

  // 2. Flipkart
  else if (host.includes('flipkart.com')) {
    merchantName = 'Flipkart';
    const titleEl = document.querySelector('.B_NuCI') || document.querySelector('h1 span');
    title = titleEl?.textContent?.trim() || '';

    const priceEl = document.querySelector('._30jeq3._16Jk6d') || document.querySelector('._30jeq3');
    if (priceEl) {
      price = parseInt(priceEl.textContent?.replace(/[^0-9]/g, '') || '', 10);
    }

    const mrpEl = document.querySelector('._3I9_wc._2p6cR5');
    if (mrpEl) {
      mrp = parseInt(mrpEl.textContent?.replace(/[^0-9]/g, '') || '', 10);
    }

    const imgEl = document.querySelector('._396cs4._2amPTt') as HTMLImageElement;
    imageUrl = imgEl?.src || '';
  }

  // 3. Blinkit Quick Commerce
  else if (host.includes('blinkit.com')) {
    merchantName = 'Blinkit (10-min Delivery)';
    const titleEl = document.querySelector('[data-test-id="product-name"]') || document.querySelector('h1');
    title = titleEl?.textContent?.trim() || '';

    const priceEl = document.querySelector('[data-test-id="product-price"]') || document.querySelector('div[style*="font-weight: 700"]');
    if (priceEl) {
      price = parseInt(priceEl.textContent?.replace(/[^0-9]/g, '') || '', 10);
    }
  }

  // 4. Zepto Quick Commerce
  else if (host.includes('zeptonow.com')) {
    merchantName = 'Zepto (10-min Delivery)';
    const titleEl = document.querySelector('h1') || document.querySelector('[data-testid="product-name"]');
    title = titleEl?.textContent?.trim() || '';

    const priceEl = document.querySelector('[data-testid="product-price"]') || document.querySelector('h4');
    if (priceEl) {
      price = parseInt(priceEl.textContent?.replace(/[^0-9]/g, '') || '', 10);
    }
  }

  // 5. Croma Retail
  else if (host.includes('croma.com')) {
    merchantName = 'Croma Retail';
    const titleEl = document.querySelector('.pdp-title') || document.querySelector('h1');
    title = titleEl?.textContent?.trim() || '';

    const priceEl = document.querySelector('.amount') || document.querySelector('#pdp-product-price');
    if (priceEl) {
      price = parseInt(priceEl.textContent?.replace(/[^0-9]/g, '') || '', 10);
    }
  }

  // Generic Meta fallback
  if (!title) {
    const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content');
    title = ogTitle || document.title || '';
  }

  if (!price || price <= 0 || !title || title.length < 3) {
    return null;
  }

  return {
    url: window.location.href,
    title,
    price,
    mrp,
    domain: host,
    merchantName,
    imageUrl,
    inStock,
  };
}

/**
 * Injects the floating DealPilot comparison widget into the shopping page
 */
export function injectDealPilotOverlay(info: ExtractedProductInfo, comparisonData: any) {
  // Prevent duplicate injection
  if (document.getElementById('dealpilot-injected-overlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'dealpilot-injected-overlay';
  overlay.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 2147483647;
    background: #090d16;
    color: #f8fafc;
    border: 1px solid #1e293b;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
    border-radius: 20px;
    padding: 16px;
    width: 320px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  `;

  const comp = comparisonData?.comparison;
  const bestCompetitor = comp?.bestCompetitor;
  const savings = comp?.potentialSavings || 0;
  const hasCheaper = comp?.hasCheaperAlternative;

  overlay.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px solid #1e293b; padding-bottom: 8px;">
      <div style="display: flex; items-center; gap: 8px;">
        <span style="background: #10b981; color: #090d16; font-weight: 900; font-size: 11px; padding: 2px 6px; border-radius: 6px;">DEALPILOT</span>
        <span style="font-size: 12px; font-weight: 700; color: #94a3b8;">India Price Radar</span>
      </div>
      <button id="dp-close-btn" style="background: transparent; border: none; color: #94a3b8; cursor: pointer; font-size: 14px;">✕</button>
    </div>

    ${
      hasCheaper && bestCompetitor
        ? `
        <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; padding: 10px; margin-bottom: 12px;">
          <div style="font-size: 12px; font-weight: 800; color: #34d399;">⚡ Cheaper at ${bestCompetitor.seller.name}!</div>
          <div style="font-size: 11px; color: #cbd5e1; margin-top: 2px;">
            Save <strong>₹${savings.toLocaleString('en-IN')}</strong> (Pay ₹${bestCompetitor.price.itemPrice.toLocaleString('en-IN')})
          </div>
        </div>
        `
        : `
        <div style="background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 12px; padding: 10px; margin-bottom: 12px;">
          <div style="font-size: 12px; font-weight: 800; color: #38bdf8;">✓ Best Live Price Verified!</div>
          <div style="font-size: 11px; color: #cbd5e1; margin-top: 2px;">
            This is currently the lowest price across 7 stores.
          </div>
        </div>
        `
    }

    <!-- Dual Actions: BUY NOW vs LEAVE -->
    <div style="display: flex; gap: 8px; margin-top: 8px;">
      <button id="dp-leave-btn" style="flex: 1; padding: 8px; background: #1e293b; color: #cbd5e1; border: 1px solid #334155; border-radius: 10px; font-weight: 700; font-size: 12px; cursor: pointer;">
        Leave
      </button>
      <button id="dp-buy-btn" style="flex: 1; padding: 8px; background: #10b981; color: #022c22; border: none; border-radius: 10px; font-weight: 900; font-size: 12px; cursor: pointer;">
        Buy Now
      </button>
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById('dp-close-btn')?.addEventListener('click', () => overlay.remove());
  document.getElementById('dp-leave-btn')?.addEventListener('click', () => overlay.remove());
  document.getElementById('dp-buy-btn')?.addEventListener('click', () => {
    const targetUrl = bestCompetitor?.offerUrl || info.url;
    window.open(targetUrl, '_blank');
  });
}
