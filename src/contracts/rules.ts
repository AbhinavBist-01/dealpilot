import { z } from 'zod';

export type TrackingStrategy = 'target_price' | 'best_deal_by_deadline' | 'near_historical_low';
export type TrackingStatus = 'active' | 'paused' | 'triggered' | 'expired';
export type PollingPolicy = 'normal' | 'near_target' | 'backoff';

export interface TrackingRuleInput {
  productId: string;
  offerId?: string;
  targetPrice: number;
  currency?: string;
  strategy?: TrackingStrategy;
  deadline?: Date;
}

export const CreateTrackingRuleSchema = z.object({
  productId: z.string().uuid(),
  offerId: z.string().uuid().optional(),
  targetPrice: z.number().positive(),
  currency: z.string().default('INR'),
  strategy: z.enum(['target_price', 'best_deal_by_deadline', 'near_historical_low']).default('target_price'),
  deadline: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined),
});

export const UpdateTrackingRuleSchema = z.object({
  targetPrice: z.number().positive().optional(),
  status: z.enum(['active', 'paused', 'triggered', 'expired']).optional(),
  deadline: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined),
});
