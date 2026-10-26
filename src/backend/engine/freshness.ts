import { OfferFreshnessStatus } from "../contracts/offer";

export const FRESHNESS_WINDOW_MS = 2 * 60 * 60 * 1000;

export function calculateFreshnessStatus(params: {
  lastCheckedAt: Date;
  availabilityStatus: string;
  sourceConfidence?: number;
  lastError?: string | null;
  customWindowMs?: number;
}): OfferFreshnessStatus {
  if (params.lastError) {
    return "error";
  }

  if (params.availabilityStatus === "out_of_stock") {
    return "unavailable";
  }

  const windowMs = params.customWindowMs || FRESHNESS_WINDOW_MS;
  const ageMs = Date.now() - new Date(params.lastCheckedAt).getTime();

  if (ageMs > windowMs) {
    return "stale";
  }

  if (params.sourceConfidence !== undefined && params.sourceConfidence < 0.5) {
    return "unknown";
  }

  return "fresh";
}

export function isOfferActionable(
  freshnessStatus: OfferFreshnessStatus,
  availabilityStatus: string,
): boolean {
  return freshnessStatus === "fresh" && availabilityStatus === "in_stock";
}
