/**
 * DealPilot Shopping Assistant — Background Service Worker
 * 
 * Coordinates:
 * 1. API calls between content scripts and the DealPilot backend.
 * 2. Extension state (user token, cached competitor matches, recent watches).
 * 3. Chrome system notifications for price drops & quick commerce alerts.
 */

declare const chrome: any;

export interface ExtensionMessageRequest {
  type: 'CHECK_PRODUCT_DEALS' | 'GET_COUPONS' | 'CREATE_BUY_DIRECTIVE' | 'GET_EXTENSION_STATE';
  payload: any;
}

export interface ExtensionState {
  isConfigured: boolean;
  activeWatchesCount: number;
  lastCheckedProduct: any | null;
  lastMatchedCompetitor: any | null;
}

// In-memory runtime state
const localState: ExtensionState = {
  isConfigured: true,
  activeWatchesCount: 0,
  lastCheckedProduct: null,
  lastMatchedCompetitor: null,
};

const BACKEND_BASE_URL = typeof window !== 'undefined'
  ? window.location.origin
  : 'http://localhost:3000';

/**
 * Coordinates API query to DealPilot Backend
 */
export async function handleCheckProductDeals(productInfo: {
  url: string;
  title: string;
  price: number;
  domain?: string;
  merchantName?: string;
}) {
  try {
    const res = await fetch(`${BACKEND_BASE_URL}/api/extension/match`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: productInfo.url,
        title: productInfo.title,
        price: productInfo.price,
        domain: productInfo.domain || 'amazon.in',
        merchant: productInfo.merchantName || 'Online Store',
      }),
    });

    const data = await res.json();
    if (res.ok && data.success) {
      localState.lastCheckedProduct = data.currentProduct;
      localState.lastMatchedCompetitor = data.comparison?.bestCompetitor;

      // If a quick commerce / cheaper option exists, trigger notification
      if (data.comparison?.hasCheaperAlternative && data.comparison?.bestCompetitor) {
        dispatchPriceDropNotification(
          data.currentProduct.title,
          data.comparison.bestCompetitor.seller.name,
          data.comparison.potentialSavings
        );
      }

      return data;
    }
    return null;
  } catch (error) {
    console.error('[Background Worker] Failed to match product deals:', error);
    return null;
  }
}

/**
 * Coordinates coupon verification for checkout integration
 */
export async function handleGetCoupons(domain: string, amount: number) {
  try {
    const res = await fetch(
      `${BACKEND_BASE_URL}/api/coupons?domain=${encodeURIComponent(domain)}&amount=${amount}`
    );
    return await res.json();
  } catch (error) {
    console.error('[Background Worker] Failed to fetch coupons:', error);
    return { applicable: [], bestCoupon: null };
  }
}

/**
 * Dispatches desktop / tab notification
 */
export function dispatchPriceDropNotification(
  productTitle: string,
  merchantName: string,
  savings: number
) {
  const title = `🚨 Deal Alert: Cheaper on ${merchantName}!`;
  const message = `Found ${productTitle.slice(0, 40)}... for ₹${savings.toLocaleString('en-IN')} less!`;

  if (typeof chrome !== 'undefined' && chrome.notifications) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon-128.png',
      title,
      message,
      priority: 2,
    });
  } else {
    console.log(`[Notification Dispatch] ${title} — ${message}`);
  }
}

// Chrome runtime message listener registration
if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener(
    (request: ExtensionMessageRequest, _sender: any, sendResponse: (res?: any) => void) => {
      if (request.type === 'CHECK_PRODUCT_DEALS') {
        handleCheckProductDeals(request.payload).then(sendResponse);
        return true; // Keep channel open for async response
      }

      if (request.type === 'GET_COUPONS') {
        handleGetCoupons(request.payload.domain, request.payload.amount).then(sendResponse);
        return true;
      }

      if (request.type === 'GET_EXTENSION_STATE') {
        sendResponse(localState);
        return false;
      }
    }
  );
}
