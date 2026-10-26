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

export function calculateDealScore(input: ScoreInput): DealEvaluationResult {
  const { offer, targetPrice, historicalPrices = [] } = input;
  const missingEvidence: string[] = [];

  let score = 0; // baseline
  const price = offer.price.totalPrice;

  // 1. Historical Delta component (up to 35 points)
  let percentBelow30DayAvg: number | undefined;
  let percentFromAllTimeLow: number | undefined;
  let isHistoricalLow = false;
  const hasSufficientHistory = historicalPrices.length >= 5;

  if (hasSufficientHistory) {
    const avgPrice =
      historicalPrices.reduce((a, b) => a + b, 0) / historicalPrices.length;
    percentBelow30DayAvg = ((avgPrice - price) / avgPrice) * 100;

    const minPrice = Math.min(...historicalPrices);
    percentFromAllTimeLow = ((price - minPrice) / minPrice) * 100;
    isHistoricalLow = price <= minPrice;

    if (percentBelow30DayAvg > 0) {
      // Reward up to 25 pts for being below average
      score += Math.min(25, Math.round(percentBelow30DayAvg * 1.5));
    } else {
      // Penalize for being above average
      score -= Math.min(20, Math.round(Math.abs(percentBelow30DayAvg)));
    }

    if (isHistoricalLow) {
      score += 10;
    }
  } else {
    missingEvidence.push("Sparse historical price observations (< 5 samples)");
  }

  // 2. Target Price Delta component (up to 25 points)
  let priceVsTargetDelta: number | undefined;
  if (targetPrice) {
    priceVsTargetDelta = price - targetPrice;
    if (price <= targetPrice) {
      const discountPct = ((targetPrice - price) / targetPrice) * 100;
      score += Math.min(25, 10 + Math.round(discountPct * 1.5));
    } else {
      const overPct = ((price - targetPrice) / targetPrice) * 100;
      score -= Math.min(25, Math.round(overPct * 1.5));
    }
  } else {
    missingEvidence.push("No user target price set");
  }

  // 3. Seller Reliability (up to 20 points)
  if (offer.seller.isAuthorized) {
    score += 10;
  }
  if (offer.seller.rating) {
    if (offer.seller.rating >= 4.5) score += 10;
    else if (offer.seller.rating >= 4.0) score += 5;
    else if (offer.seller.rating < 3.5) score -= 10;
  } else {
    missingEvidence.push("Seller rating not available");
  }

  // 4. Stock and Freshness (up to 20 points)
  if (offer.availabilityStatus === "in_stock") {
    score += 5;
  } else {
    score -= 30;
  }

  if (offer.freshnessStatus === "fresh") {
    score += 5;
  } else {
    score -= 15;
    missingEvidence.push(`Offer freshness status is ${offer.freshnessStatus}`);
  }

  // Clamp score between 0 and 100
  score = Math.max(0, Math.min(100, Math.round(score)));

  // Recommendation logic
  let recommendation: DealRecommendation = "fair";
  if (score >= 80) recommendation = "strong_buy";
  else if (score >= 65) recommendation = "buy";
  else if (score < 40) recommendation = "pass";

  // Confidence level
  let confidenceLevel: ConfidenceLevel = "high";
  if (missingEvidence.length >= 2 || !hasSufficientHistory) {
    confidenceLevel = "low";
  } else if (missingEvidence.length === 1) {
    confidenceLevel = "medium";
  }

  const signals: DealSignals = {
    finalPrice: price,
    priceVsTargetDelta,
    percentBelow30DayAvg,
    percentFromAllTimeLow,
    isHistoricalLow,
    isAuthorizedSeller: offer.seller.isAuthorized,
    sellerRating: offer.seller.rating,
    sellerReviewCount: offer.seller.reviewCount,
    stockConfirmed: offer.availabilityStatus === "in_stock",
    freshnessStatus: offer.freshnessStatus || "fresh",
    hasSufficientHistory,
  };

  // Generate clear factual explanation
  let explanation = `Deal rating ${score}/100 (${recommendation.replace("_", " ").toUpperCase()}). `;
  if (isHistoricalLow) {
    explanation += `Matches or beats all-time observed low! `;
  } else if (percentBelow30DayAvg && percentBelow30DayAvg > 0) {
    explanation += `${percentBelow30DayAvg.toFixed(1)}% below 30-day average. `;
  }
  if (targetPrice && price <= targetPrice) {
    explanation += `Meets target price of ₹${targetPrice}. `;
  }
  if (offer.seller.isAuthorized) {
    explanation += `Sold by authorized retailer (${offer.seller.name}). `;
  }
  if (missingEvidence.length > 0) {
    explanation += `Note: ${missingEvidence.join(", ")}.`;
  }

  return {
    score,
    scoreVersion: "rubric_v1",
    recommendation,
    confidenceLevel,
    signals,
    missingEvidence,
    explanation,
    evaluatedAt: new Date(),
  };
}
