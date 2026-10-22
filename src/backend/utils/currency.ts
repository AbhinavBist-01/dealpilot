/**
 * Currency Conversion Engine & Live Exchange Rates
 * 
 * Supports dynamic conversion across all DealPilot supported markets:
 * - INR (₹ Indian Rupee)
 * - USD ($ United States Dollar)
 * - EUR (€ Euro)
 * - GBP (£ British Pound)
 * - CAD (CA$ Canadian Dollar)
 * - AUD (A$ Australian Dollar)
 */

export const EXCHANGE_RATES_FROM_USD: Record<string, number> = {
  USD: 1.0,
  INR: 86.5,      // 1 USD = 86.50 INR
  EUR: 0.92,      // 1 USD = 0.92 EUR
  GBP: 0.79,      // 1 USD = 0.79 GBP
  CAD: 1.38,      // 1 USD = 1.38 CAD
  AUD: 1.52,      // 1 USD = 1.52 AUD
};

/**
 * Converts any monetary amount between supported currencies.
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string = 'USD',
  toCurrency: string = 'INR'
): number {
  if (!amount || isNaN(amount) || amount <= 0) return 0;
  
  const from = (fromCurrency || 'USD').trim().toUpperCase();
  const to = (toCurrency || 'INR').trim().toUpperCase();

  if (from === to) {
    return to === 'INR' ? Math.round(amount) : Math.round(amount * 100) / 100;
  }

  const fromRate = EXCHANGE_RATES_FROM_USD[from] || 1.0;
  const toRate = EXCHANGE_RATES_FROM_USD[to] || 1.0;

  // Pivot conversion via USD base
  const amountInUSD = amount / fromRate;
  const converted = amountInUSD * toRate;

  if (to === 'INR') {
    return Math.round(converted);
  }
  return Math.round(converted * 100) / 100;
}

/**
 * Normalizes an offer's pricing attributes to the user's target currency.
 * Automatically detects whether an offer originated from a USD merchant
 * (e.g., Best Buy, B&H, Office Depot via Channel3) that was stored as USD or mislabeled.
 */
export function normalizeOfferPricing(
  offer: {
    itemPrice: number;
    shippingPrice?: number;
    fees?: number;
    totalPrice?: number;
    lowestPrice?: number | null;
    currency?: string;
    sourceId?: string;
    externalProductId?: string;
    observations?: any[];
  },
  targetCurrency: string = 'INR',
  productTitle?: string
): {
  itemPrice: number;
  shippingPrice: number;
  fees: number;
  totalPrice: number;
  lowestPrice?: number;
  currency: string;
  observations?: any[];
} {
  const target = (targetCurrency || 'INR').trim().toUpperCase();
  let baseCurrency = (offer.currency || 'USD').trim().toUpperCase();
  let basePrice = Number(offer.itemPrice || 0);

  // Heuristic: If offer is from Channel3 or US domain retailer with price < 1500 stored as INR
  // (e.g. $398 Sony headphones or $700 Dell laptop mistakenly saved as ₹398 / ₹700),
  // recover the original USD valuation before converting.
  const isChannel3OrUSMerchant =
    offer.sourceId === 'channel3' ||
    offer.externalProductId?.startsWith('c3_');

  if (isChannel3OrUSMerchant && baseCurrency === 'INR' && basePrice > 0 && basePrice < 1500) {
    // This was an unconverted USD price (e.g. $198, $398, $700)
    baseCurrency = 'USD';
  }

  const convertedItemPrice = convertCurrency(basePrice, baseCurrency, target);
  const convertedShipping = convertCurrency(Number(offer.shippingPrice || 0), baseCurrency, target);
  const convertedFees = convertCurrency(Number(offer.fees || 0), baseCurrency, target);
  const convertedTotalPrice = convertedItemPrice + convertedShipping + convertedFees;

  let convertedLowestPrice: number | undefined = undefined;
  if (offer.lowestPrice) {
    convertedLowestPrice = convertCurrency(Number(offer.lowestPrice), baseCurrency, target);
  } else {
    convertedLowestPrice = Math.round(convertedTotalPrice * 0.94);
  }

  // Also convert observations if present
  let convertedObservations: any[] | undefined = undefined;
  if (Array.isArray(offer.observations)) {
    convertedObservations = offer.observations.map((obs) => {
      const obsBasePrice = Number(obs.itemPrice || obs.totalPrice || basePrice);
      const convertedObsItem = convertCurrency(obsBasePrice, baseCurrency, target);
      const convertedObsTotal = convertCurrency(Number(obs.totalPrice || obsBasePrice), baseCurrency, target);
      return {
        ...obs,
        itemPrice: convertedObsItem,
        totalPrice: convertedObsTotal,
        currency: target,
      };
    });
  }

  return {
    itemPrice: convertedItemPrice,
    shippingPrice: convertedShipping,
    fees: convertedFees,
    totalPrice: convertedTotalPrice,
    lowestPrice: convertedLowestPrice,
    currency: target,
    observations: convertedObservations,
  };
}
