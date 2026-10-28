import { NormalizedOffer } from "../contracts/offer";
import {
  DealEvaluationResult,
  DealRecommendation,
  ConfidenceLevel,
  DealSignals,
} from "../contracts/evaluation";

export interface ScoreInput {
  offer: NormalizedOffer;
  targetPrice?: number;
  historicalPrices?: number[]; // past observations
  budget?: number;
}

export interface DealScoreBreakdown {
  priceDealQuality: number; // P (30%)
  productQuality: number;   // Q (25%)
  priceHistory: number;     // H (15%)
  sellerTrust: number;      // T (15%)
  userFit: number;          // U (15%)
}

/**
 * Value & Deal Scoring Engine
 *
 * Scoring Model:
 * S = 0.30*P + 0.25*Q + 0.15*H + 0.15*T + 0.15*U
 *
 * - P (30%): Price & deal quality (Current price vs historical prices & comparable listings)
 * - Q (25%): Product quality (Ratings, review volume, review authenticity)
 * - H (15%): Price history (Historical lows, average price, recent price movements)
 * - T (15%): Seller trust (Seller reputation, authorization, warranty, in-stock status)
 * - U (15%): User fit (Budget/target alignment, condition match, availability)
 *
 * Each component is scored 0–100. The final score is rounded to an integer.
 */
export function calculateDealScore(input: ScoreInput): DealEvaluationResult & { breakdown: DealScoreBreakdown } {
  const { offer, targetPrice, historicalPrices = [], budget } = input;
  const missingEvidence: string[] = [];
  const currentPrice = offer.price.totalPrice;

  // -------------------------------------------------------------
  // 1. Price & Deal Quality (P: 0 - 100, Weight: 30%)
  // Current price vs historical prices, target prices, and reference listings
  // -------------------------------------------------------------
  let P = 75; // baseline neutral
  const hasHistory = historicalPrices.length > 0;
  let avgPrice: number | undefined;
  let percentBelow30DayAvg: number | undefined;
  let isHistoricalLow = false;
  let percentFromAllTimeLow: number | undefined;

  if (hasHistory) {
    avgPrice = historicalPrices.reduce((a, b) => a + b, 0) / historicalPrices.length;
    percentBelow30DayAvg = ((avgPrice - currentPrice) / avgPrice) * 100;
    const minHistorical = Math.min(...historicalPrices);
    isHistoricalLow = currentPrice <= minHistorical;
    percentFromAllTimeLow = ((currentPrice - minHistorical) / minHistorical) * 100;

    if (percentBelow30DayAvg >= 20) {
      P = 95;
    } else if (percentBelow30DayAvg >= 10) {
      P = 85 + Math.round((percentBelow30DayAvg - 10));
    } else if (percentBelow30DayAvg >= 0) {
      P = 75 + Math.round(percentBelow30DayAvg);
    } else {
      // Above average: deduct points
      P = Math.max(20, 75 - Math.round(Math.abs(percentBelow30DayAvg) * 1.5));
    }
  } else {
    missingEvidence.push("Sparse historical price observations");
    // Synthetic reference comparison if available
    const refPrice = offer.price.itemPrice || currentPrice;
    if (currentPrice < refPrice) {
      const discount = ((refPrice - currentPrice) / refPrice) * 100;
      P = Math.min(95, 75 + Math.round(discount * 1.5));
    }
  }

  // Factor targetPrice or budget into P if available
  const effectiveThreshold = targetPrice || budget;
  let priceVsTargetDelta: number | undefined;
  if (effectiveThreshold) {
    priceVsTargetDelta = currentPrice - effectiveThreshold;
    if (currentPrice <= effectiveThreshold) {
      const underPct = ((effectiveThreshold - currentPrice) / effectiveThreshold) * 100;
      P = Math.min(100, P + Math.max(5, Math.round(underPct * 1.2)));
    } else {
      const overPct = ((currentPrice - effectiveThreshold) / effectiveThreshold) * 100;
      P = Math.max(15, P - Math.round(overPct * 1.5));
    }
  }
  P = Math.max(0, Math.min(100, Math.round(P)));

  // -------------------------------------------------------------
  // 2. Product Quality (Q: 0 - 100, Weight: 25%)
  // Ratings, review volume, review authenticity and reliability
  // -------------------------------------------------------------
  let Q = 75; // baseline neutral
  const rating = offer.seller.rating || (offer as any).productRating;
  const reviewCount = offer.seller.reviewCount || (offer as any).reviewCount;

  if (rating !== undefined && rating > 0) {
    // 5.0 scale normalized to 0-100: rating of 4.8 => 96 base
    let ratingScore = (rating / 5.0) * 100;

    // Review volume reliability multiplier
    if (reviewCount !== undefined) {
      if (reviewCount >= 1000) ratingScore += 4;
      else if (reviewCount >= 100) ratingScore += 2;
      else if (reviewCount < 10) ratingScore -= 8;
    }
    Q = ratingScore;
  } else {
    missingEvidence.push("Product rating not provided");
  }

  if (offer.seller.isAuthorized) {
    Q += 5; // authenticity trust signal
  }
  Q = Math.max(0, Math.min(100, Math.round(Q)));

  // -------------------------------------------------------------
  // 3. Price History (H: 0 - 100, Weight: 15%)
  // Historical lows, average price and recent price movements
  // -------------------------------------------------------------
  let H = 70; // baseline neutral
  if (hasHistory) {
    if (isHistoricalLow) {
      H = 98;
    } else if (percentFromAllTimeLow !== undefined) {
      if (percentFromAllTimeLow <= 3) {
        H = 90;
      } else if (percentFromAllTimeLow <= 10) {
        H = 80;
      } else if (percentFromAllTimeLow <= 20) {
        H = 65;
      } else {
        H = Math.max(25, 60 - Math.round(percentFromAllTimeLow));
      }
    }

    // Trajectory trend
    if (historicalPrices.length >= 3) {
      const recent = historicalPrices.slice(-3);
      if (recent[recent.length - 1] < recent[0]) {
        H = Math.min(100, H + 5); // Downward trajectory
      }
    }
  } else {
    missingEvidence.push("No multi-observation price history");
  }
  H = Math.max(0, Math.min(100, Math.round(H)));

  // -------------------------------------------------------------
  // 4. Seller Trust (T: 0 - 100, Weight: 15%)
  // Seller reputation, return policy, warranty and fulfillment
  // -------------------------------------------------------------
  let T = 70; // baseline
  if (offer.seller.isAuthorized) {
    T += 15;
  }
  if (offer.seller.rating) {
    if (offer.seller.rating >= 4.5) T += 12;
    else if (offer.seller.rating >= 4.0) T += 5;
    else if (offer.seller.rating < 3.5) T -= 15;
  }

  if (offer.availabilityStatus === "in_stock") {
    T += 5;
  } else {
    T -= 35; // fulfillment risk
  }
  T = Math.max(0, Math.min(100, Math.round(T)));

  // -------------------------------------------------------------
  // 5. User Fit (U: 0 - 100, Weight: 15%)
  // Match with budget, requirements and preferences
  // -------------------------------------------------------------
  let U = 80; // baseline
  const condition = (offer.variantAttributes as any)?.condition || 'new';
  if (condition === 'new') {
    U += 10;
  } else if (condition === 'refurbished') {
    U -= 15;
  }

  if (effectiveThreshold) {
    if (currentPrice <= effectiveThreshold) {
      U += 10;
    } else {
      const overBy = ((currentPrice - effectiveThreshold) / effectiveThreshold) * 100;
      U = Math.max(20, U - Math.round(overBy * 1.5));
    }
  }

  if (offer.availabilityStatus !== "in_stock") {
    U -= 30; // user cannot purchase out-of-stock product
  }
  U = Math.max(0, Math.min(100, Math.round(U)));

  // -------------------------------------------------------------
  // Final Score Formula:
  // S = 0.30*P + 0.25*Q + 0.15*H + 0.15*T + 0.15*U
  // -------------------------------------------------------------
  const finalScore = Math.round(
    0.30 * P +
    0.25 * Q +
    0.15 * H +
    0.15 * T +
    0.15 * U
  );
  const score = Math.max(0, Math.min(100, finalScore));

  // Recommendation categorization
  let recommendation: DealRecommendation = "fair";
  if (score >= 80) recommendation = "strong_buy";
  else if (score >= 65) recommendation = "buy";
  else if (score < 40) recommendation = "pass";

  // Confidence level
  let confidenceLevel: ConfidenceLevel = "high";
  if (missingEvidence.length >= 2 || !hasHistory) {
    confidenceLevel = "low";
  } else if (missingEvidence.length === 1) {
    confidenceLevel = "medium";
  }

  const signals: DealSignals = {
    finalPrice: currentPrice,
    priceVsTargetDelta,
    percentBelow30DayAvg,
    percentFromAllTimeLow,
    isHistoricalLow,
    isAuthorizedSeller: offer.seller.isAuthorized,
    sellerRating: offer.seller.rating,
    sellerReviewCount: offer.seller.reviewCount,
    stockConfirmed: offer.availabilityStatus === "in_stock",
    freshnessStatus: offer.freshnessStatus || "fresh",
    hasSufficientHistory: hasHistory,
  };

  // Human-readable explanation with breakdown
  let explanation = `Deal rating ${score}/100 (${recommendation.replace("_", " ").toUpperCase()}). `;
  if (isHistoricalLow) {
    explanation += `Matches or beats all-time observed low! `;
  } else if (percentBelow30DayAvg && percentBelow30DayAvg > 0) {
    explanation += `${percentBelow30DayAvg.toFixed(1)}% below 30-day average. `;
  }
  if (effectiveThreshold && currentPrice <= effectiveThreshold) {
    explanation += `Meets target threshold of ₹${effectiveThreshold.toLocaleString()}. `;
  }
  if (offer.seller.isAuthorized) {
    explanation += `Sold by verified retailer (${offer.seller.name}). `;
  }
  if (missingEvidence.length > 0) {
    explanation += `Note: ${missingEvidence.join(", ")}.`;
  }

  return {
    score,
    scoreVersion: "value_deal_score_v2",
    recommendation,
    confidenceLevel,
    signals,
    missingEvidence,
    explanation,
    evaluatedAt: new Date(),
    breakdown: {
      priceDealQuality: P,
      productQuality: Q,
      priceHistory: H,
      sellerTrust: T,
      userFit: U,
    },
  };
}
