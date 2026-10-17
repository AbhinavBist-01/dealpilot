import { NormalizedOffer } from '../contracts/offer';
import { calculateFreshnessStatus } from './freshness';

export interface RuleEvaluationInput {
  targetPrice: number;
  strategy?: 'target_price' | 'best_deal_by_deadline' | 'near_historical_low';
  deadline?: Date | null;
  requiredCondition?: 'new' | 'refurbished' | 'open_box';
  requiredColor?: string;
  requiredStorage?: string;
}

export interface RuleEvaluationResult {
  triggered: boolean;
  reason: string;
  violations: string[];
  currentPrice: number;
  targetPrice: number;
  isVariantMatch: boolean;
  isAvailable: boolean;
  isFresh: boolean;
}

export function evaluateDeterministicRules(
  offer: NormalizedOffer,
  rules: RuleEvaluationInput
): RuleEvaluationResult {
  const violations: string[] = [];

  // 1. Condition & Variant Checks
  let isVariantMatch = true;
  if (rules.requiredCondition && offer.variantAttributes.condition !== rules.requiredCondition) {
    violations.push(`Condition mismatch: requested '${rules.requiredCondition}', found '${offer.variantAttributes.condition}'`);
    isVariantMatch = false;
  }
  if (rules.requiredColor && offer.variantAttributes.color &&
      offer.variantAttributes.color.toLowerCase() !== rules.requiredColor.toLowerCase()) {
    violations.push(`Color mismatch: requested '${rules.requiredColor}', found '${offer.variantAttributes.color}'`);
    isVariantMatch = false;
  }
  if (rules.requiredStorage && offer.variantAttributes.storage &&
      offer.variantAttributes.storage.toLowerCase() !== rules.requiredStorage.toLowerCase()) {
    violations.push(`Storage mismatch: requested '${rules.requiredStorage}', found '${offer.variantAttributes.storage}'`);
    isVariantMatch = false;
  }

  // 2. Stock and Freshness Checks
  const isAvailable = offer.availabilityStatus === 'in_stock';
  if (!isAvailable) {
    violations.push(`Item is currently out of stock (${offer.availabilityStatus})`);
  }

  const freshness = offer.freshnessStatus || calculateFreshnessStatus({
    lastCheckedAt: offer.observedAt,
    availabilityStatus: offer.availabilityStatus,
  });
  const isFresh = freshness === 'fresh';
  if (!isFresh) {
    violations.push(`Offer is not fresh (status: ${freshness})`);
  }

  // 3. Price Target Check
  const currentPrice = offer.price.totalPrice;
  const targetPrice = rules.targetPrice;
  let priceMet = false;

  const strategy = rules.strategy || 'target_price';
  if (strategy === 'target_price') {
    priceMet = currentPrice <= targetPrice;
    if (!priceMet) {
      violations.push(`Price ₹${currentPrice} exceeds target ₹${targetPrice}`);
    }
  } else if (strategy === 'near_historical_low') {
    // Within 3% of target/historical low
    const threshold = targetPrice * 1.03;
    priceMet = currentPrice <= threshold;
    if (!priceMet) {
      violations.push(`Price ₹${currentPrice} exceeds near-historical threshold ₹${threshold.toFixed(2)}`);
    }
  } else if (strategy === 'best_deal_by_deadline') {
    // Under target or deadline reached with best price
    const now = new Date();
    const deadlinePassed = rules.deadline ? now >= rules.deadline : false;
    priceMet = currentPrice <= targetPrice || deadlinePassed;
    if (!priceMet) {
      violations.push(`Price ₹${currentPrice} exceeds target and deadline has not arrived`);
    }
  }

  const triggered = violations.length === 0;

  let reason = '';
  if (triggered) {
    reason = `Target achieved! Current price ₹${currentPrice} satisfies target ₹${targetPrice} (${strategy}).`;
  } else {
    reason = `Rule not triggered: ${violations.join('; ')}`;
  }

  return {
    triggered,
    reason,
    violations,
    currentPrice,
    targetPrice,
    isVariantMatch,
    isAvailable,
    isFresh,
  };
}
