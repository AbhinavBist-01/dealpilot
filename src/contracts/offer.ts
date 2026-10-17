import { z } from 'zod';

export type AvailabilityStatus = 'in_stock' | 'out_of_stock' | 'preorder';
export type OfferFreshnessStatus = 'fresh' | 'stale' | 'unavailable' | 'unknown' | 'error';

export interface VariantAttributes {
  color?: string;
  storage?: string;
  condition: 'new' | 'refurbished' | 'open_box';
  [key: string]: string | undefined;
}

export interface SellerInfo {
  id: string;
  name: string;
  isAuthorized: boolean;
  rating?: number;
  reviewCount?: number;
}

export interface PriceBreakdown {
  itemPrice: number;
  shippingPrice: number;
  fees: number;
  currency: string;
  totalPrice: number;
}

export interface NormalizedOffer {
  sourceId: string;               // e.g. 'amazon', 'bestbuy', 'mock_retailer'
  externalProductId: string;
  offerUrl: string;
  canonicalProductId: string;
  title: string;
  brand: string;
  model: string;
  category: string;
  imageUrl?: string;
  variantAttributes: VariantAttributes;
  seller: SellerInfo;
  price: PriceBreakdown;
  availabilityStatus: AvailabilityStatus;
  freshnessStatus?: OfferFreshnessStatus;
  sourceConfidence: number;        // 0.0 - 1.0
  observedAt: Date;
}

// Zod Schema for validation
export const NormalizedOfferSchema = z.object({
  sourceId: z.string().min(1),
  externalProductId: z.string().min(1),
  offerUrl: z.string().url(),
  canonicalProductId: z.string().min(1),
  title: z.string().min(1),
  brand: z.string().min(1),
  model: z.string().min(1),
  category: z.string().min(1),
  imageUrl: z.string().url().optional(),
  variantAttributes: z.object({
    color: z.string().optional(),
    storage: z.string().optional(),
    condition: z.enum(['new', 'refurbished', 'open_box']),
  }),
  seller: z.object({
    id: z.string(),
    name: z.string().min(1),
    isAuthorized: z.boolean(),
    rating: z.number().min(0).max(5).optional(),
    reviewCount: z.number().min(0).optional(),
  }),
  price: z.object({
    itemPrice: z.number().positive(),
    shippingPrice: z.number().nonnegative(),
    fees: z.number().nonnegative(),
    currency: z.string().min(3).max(4),
    totalPrice: z.number().positive(),
  }),
  availabilityStatus: z.enum(['in_stock', 'out_of_stock', 'preorder']),
  freshnessStatus: z.enum(['fresh', 'stale', 'unavailable', 'unknown', 'error']).optional(),
  sourceConfidence: z.number().min(0).max(1),
  observedAt: z.date(),
});
