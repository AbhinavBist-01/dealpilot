export const EXCHANGE_RATES: Record<string, number> = {
  USD: 1.0,
  INR: 86.5,
  EUR: 0.92,
  GBP: 0.79,
  CAD: 1.36,
  AUD: 1.52,
};

export function convertCurrency(
  amount: number,
  fromCurrency: string = 'INR',
  toCurrency: string = 'INR'
): number {
  const from = (fromCurrency || 'INR').toUpperCase();
  const to = (toCurrency || 'INR').toUpperCase();
  if (from === to) return amount;

  const rateFrom = EXCHANGE_RATES[from] || 1.0;
  const rateTo = EXCHANGE_RATES[to] || 1.0;

  // Convert to USD then to target
  const inUSD = amount / rateFrom;
  const converted = inUSD * rateTo;
  return Math.round(converted);
}

export function normalizeOfferPricing(
  offer: any,
  targetCurrency: string = 'INR',
  productTitle?: string
): { itemPrice: number; totalPrice: number; currency: string } {
  const currentCurrency = (offer.currency || 'INR').toUpperCase();
  const target = (targetCurrency || 'INR').toUpperCase();

  if (currentCurrency === target) {
    return {
      itemPrice: offer.itemPrice,
      totalPrice: offer.totalPrice,
      currency: target,
    };
  }

  const convertedItem = convertCurrency(offer.itemPrice, currentCurrency, target);
  const convertedTotal = convertCurrency(offer.totalPrice, currentCurrency, target);

  return {
    itemPrice: convertedItem,
    totalPrice: convertedTotal,
    currency: target,
  };
}
