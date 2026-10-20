import { z } from "zod";

export type DealRecommendation = "strong_buy" | "buy" | "fair" | "pass";
export type ConfidenceLevel = "high" | "medium" | "low";

export interface DealSignals {
  finalPrice: number;
  priceVsTargetDelta?: number; // negative = savings below target
  percentBelow30DayAvg?: number; // e.g. 15.5 = 15.5% below average
  percentFromAllTimeLow?: number; // e.g. 2.0 = 2% above all-time low
  isHistoricalLow?: boolean;
  isAuthorizedSeller: boolean;
  sellerRating?: number;
  sellerReviewCount?: number;
  stockConfirmed: boolean;
  freshnessStatus: string;
  hasSufficientHistory: boolean;
}

export interface DealEvaluationResult {
  score: number; // 0 - 100
  scoreVersion: string; // 'rubric_v1'
  recommendation: DealRecommendation;
  confidenceLevel: ConfidenceLevel;
  signals: DealSignals;
  missingEvidence: string[];
  explanation: string;
  evaluatedAt: Date;
}

export const DealEvaluationSchema = z.object({
  score: z.number().min(0).max(100),
  scoreVersion: z.string(),
  recommendation: z.enum(["strong_buy", "buy", "fair", "pass"]),
  confidenceLevel: z.enum(["high", "medium", "low"]),
  signals: z.record(z.any(), z.any()),
  missingEvidence: z.array(z.string()),
  explanation: z.string(),
  evaluatedAt: z.date(),
});
