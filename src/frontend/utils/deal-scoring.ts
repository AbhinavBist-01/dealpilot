/**
 * Value & Deal Score Calculation Engine (Frontend / Universal)
 *
 * Scoring Model:
 * S = 0.30*P + 0.25*Q + 0.15*H + 0.15*T + 0.15*U
 *
 * Components (0 - 100):
 * - P (30%): Price & deal quality (Current price vs historical prices and comparable listings)
 * - Q (25%): Product quality (Ratings, review volume, review authenticity)
 * - H (15%): Price history (Historical lows, average price, recent price movements)
 * - T (15%): Seller trust (Seller reputation, return policy, warranty, fulfillment)
 * - U (15%): User fit (Match with requirements, condition, availability)
 *
 * Final score is rounded to an integer.
 */

export interface ScoreBreakdown {
  score: number;
  grade: 'strong_buy' | 'buy' | 'fair' | 'pass';
  gradeLabel: string;
  P: number; // Price & deal quality (30%)
  Q: number; // Product quality (25%)
  H: number; // Price history (15%)
  T: number; // Seller trust (15%)
  U: number; // User fit (15%)
  summary: string;
}

export function computeProductDealScore(product: any, offer?: any, targetPrice?: number): ScoreBreakdown {
  const activeOffer = offer || product?.offers?.[0];
  const currentPrice = Number(activeOffer?.totalPrice || activeOffer?.price?.totalPrice || activeOffer?.price || 0);
  const observations: any[] = activeOffer?.observations || [];
  const historicalPrices: number[] = observations.map((o) => Number(o.totalPrice || o.price)).filter((p) => !isNaN(p) && p > 0);

  // 1. Price & Deal Quality (P: 30%)
  let P = 75;
  if (historicalPrices.length > 0) {
    const avg = historicalPrices.reduce((a, b) => a + b, 0) / historicalPrices.length;
    const diffPct = ((avg - currentPrice) / avg) * 100;
    if (diffPct >= 20) P = 96;
    else if (diffPct >= 10) P = 86 + Math.round(diffPct - 10);
    else if (diffPct >= 0) P = 75 + Math.round(diffPct);
    else P = Math.max(25, 75 - Math.round(Math.abs(diffPct) * 1.5));
  } else {
    // Reference price comparison
    const originalRef = Number(activeOffer?.originalPrice || activeOffer?.itemPrice || currentPrice * 1.15);
    if (originalRef > currentPrice) {
      const discount = ((originalRef - currentPrice) / originalRef) * 100;
      P = Math.min(95, 75 + Math.round(discount * 1.2));
    }
  }
  if (targetPrice && targetPrice > 0) {
    if (currentPrice <= targetPrice) {
      const underPct = ((targetPrice - currentPrice) / targetPrice) * 100;
      P = Math.min(100, P + Math.max(4, Math.round(underPct * 1.2)));
    } else {
      const overPct = ((currentPrice - targetPrice) / targetPrice) * 100;
      P = Math.max(20, P - Math.round(overPct * 1.5));
    }
  }
  P = Math.max(0, Math.min(100, Math.round(P)));

  // 2. Product Quality (Q: 25%)
  let Q = 75;
  const rating = Number(activeOffer?.sellerRating || product?.rating || activeOffer?.seller?.rating || 4.5);
  const reviews = Number(activeOffer?.sellerReviewCount || product?.reviewCount || activeOffer?.seller?.reviewCount || 350);
  if (rating > 0) {
    let baseRating = (rating / 5.0) * 100;
    if (reviews >= 1000) baseRating += 4;
    else if (reviews >= 100) baseRating += 2;
    else if (reviews < 20) baseRating -= 6;
    Q = baseRating;
  }
  if (activeOffer?.isAuthorizedSeller || activeOffer?.seller?.isAuthorized) {
    Q += 5;
  }
  Q = Math.max(0, Math.min(100, Math.round(Q)));

  // 3. Price History (H: 15%)
  let H = 72;
  const lowestObserved = historicalPrices.length > 0
    ? Math.min(...historicalPrices)
    : Number(activeOffer?.lowestPrice || currentPrice * 0.95);
  const isAtLow = currentPrice <= lowestObserved;
  if (isAtLow) {
    H = 98;
  } else {
    const diffFromLow = ((currentPrice - lowestObserved) / lowestObserved) * 100;
    if (diffFromLow <= 3) H = 90;
    else if (diffFromLow <= 10) H = 80;
    else if (diffFromLow <= 20) H = 65;
    else H = Math.max(25, 60 - Math.round(diffFromLow));
  }
  H = Math.max(0, Math.min(100, Math.round(H)));

  // 4. Seller Trust (T: 15%)
  let T = 70;
  const isAuthorized = activeOffer?.isAuthorizedSeller || activeOffer?.seller?.isAuthorized;
  if (isAuthorized) T += 15;
  if (rating >= 4.5) T += 12;
  else if (rating >= 4.0) T += 5;
  else if (rating < 3.5) T -= 15;
  const inStock = activeOffer?.availabilityStatus === 'in_stock' || activeOffer?.stock === 'In Stock';
  if (inStock) T += 5;
  else T -= 35;
  T = Math.max(0, Math.min(100, Math.round(T)));

  // 5. User Fit (U: 15%)
  let U = 80;
  let condition = 'new';
  try {
    const attrs = typeof activeOffer?.variantAttributes === 'string'
      ? JSON.parse(activeOffer.variantAttributes)
      : activeOffer?.variantAttributes || {};
    condition = attrs.condition || activeOffer?.condition || 'new';
  } catch {
    condition = activeOffer?.condition || 'new';
  }
  if (condition === 'new') U += 10;
  else if (condition === 'refurbished') U -= 12;
  if (targetPrice && currentPrice <= targetPrice) U += 10;
  if (!inStock) U -= 25;
  U = Math.max(0, Math.min(100, Math.round(U)));

  // Final score formula: S = 0.30*P + 0.25*Q + 0.15*H + 0.15*T + 0.15*U
  const finalScore = Math.round(
    0.30 * P +
    0.25 * Q +
    0.15 * H +
    0.15 * T +
    0.15 * U
  );
  const score = Math.max(0, Math.min(100, finalScore));

  let grade: 'strong_buy' | 'buy' | 'fair' | 'pass' = 'fair';
  let gradeLabel = 'Fair Deal';
  if (score >= 85) {
    grade = 'strong_buy';
    gradeLabel = 'Great Value';
  } else if (score >= 70) {
    grade = 'buy';
    gradeLabel = 'Good Deal';
  } else if (score < 50) {
    grade = 'pass';
    gradeLabel = 'Average Price';
  }

  const summary = isAtLow
    ? `At all-time lowest price (${score}/100 value score)`
    : `${gradeLabel} based on price history, seller rating, and stock reliability (${score}/100)`;

  return {
    score,
    grade,
    gradeLabel,
    P,
    Q,
    H,
    T,
    U,
    summary,
  };
}
