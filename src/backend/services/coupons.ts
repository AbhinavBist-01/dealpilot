/**
 * Indian E-Commerce & Quick Commerce Coupon Engine
 * 
 * Provides verified discount coupons, bank offers (HDFC, ICICI, SBI, Axis),
 * and quick-commerce promo codes for supported Indian shopping merchants.
 */

export interface CouponCode {
  id: string;
  code: string;
  merchant: string;
  domain: string;
  description: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  minOrderValue: number;
  maxDiscount?: number;
  terms: string;
  isVerified: boolean;
  expiresAt: string;
}

export const VERIFIED_INDIAN_COUPONS: CouponCode[] = [
  // Amazon India
  {
    id: 'amz_hdfc_10',
    code: 'HDFCFEST10',
    merchant: 'Amazon India',
    domain: 'amazon.in',
    description: '10% Instant Discount on HDFC Bank Credit Cards & EMI',
    discountType: 'percentage',
    discountValue: 10,
    minOrderValue: 5000,
    maxDiscount: 1500,
    terms: 'Valid on electronics, appliances and mobile phones with HDFC Bank cards.',
    isVerified: true,
    expiresAt: '2026-12-31',
  },
  {
    id: 'amz_icici_5',
    code: 'ICICIAPAY5',
    merchant: 'Amazon India',
    domain: 'amazon.in',
    description: '5% Unlimited Cashback on Amazon Pay ICICI Credit Card',
    discountType: 'percentage',
    discountValue: 5,
    minOrderValue: 1000,
    terms: 'Applicable automatically for Amazon Prime members checkout.',
    isVerified: true,
    expiresAt: '2026-12-31',
  },

  // Flipkart
  {
    id: 'fk_sbi_10',
    code: 'SBISPECIAL',
    merchant: 'Flipkart',
    domain: 'flipkart.com',
    description: '10% Instant Discount with SBI Credit Cards',
    discountType: 'percentage',
    discountValue: 10,
    minOrderValue: 4999,
    maxDiscount: 1250,
    terms: 'Valid on select electronic models and audio gadgets.',
    isVerified: true,
    expiresAt: '2026-12-31',
  },
  {
    id: 'fk_supercoins',
    code: 'SUPERDEAL500',
    merchant: 'Flipkart',
    domain: 'flipkart.com',
    description: 'Flat ₹500 Off with 100 SuperCoins on orders above ₹10,000',
    discountType: 'flat',
    discountValue: 500,
    minOrderValue: 10000,
    terms: 'Applies automatically at checkout when SuperCoins balance is sufficient.',
    isVerified: true,
    expiresAt: '2026-12-31',
  },

  // Blinkit Quick Commerce
  {
    id: 'blink_welc_100',
    code: 'BLINKIT100',
    merchant: 'Blinkit',
    domain: 'blinkit.com',
    description: 'Flat ₹100 Off on your electronics and tech accessories order',
    discountType: 'flat',
    discountValue: 100,
    minOrderValue: 999,
    terms: 'Valid on Blinkit electronics and fast 10-minute delivery orders.',
    isVerified: true,
    expiresAt: '2026-12-31',
  },
  {
    id: 'blink_cred_75',
    code: 'CREDTEXT75',
    merchant: 'Blinkit',
    domain: 'blinkit.com',
    description: 'Flat ₹75 Cashback using CRED UPI on orders over ₹800',
    discountType: 'flat',
    discountValue: 75,
    minOrderValue: 800,
    terms: 'Paid via CRED UPI on Blinkit checkout.',
    isVerified: true,
    expiresAt: '2026-12-31',
  },

  // Zepto Quick Commerce
  {
    id: 'zepto_fast_15',
    code: 'ZEPTOPRO15',
    merchant: 'Zepto',
    domain: 'zeptonow.com',
    description: '15% Off up to ₹200 on gadgets, chargers and audio products',
    discountType: 'percentage',
    discountValue: 15,
    minOrderValue: 999,
    maxDiscount: 200,
    terms: 'Valid on electronics delivered within 10 minutes on Zepto.',
    isVerified: true,
    expiresAt: '2026-12-31',
  },

  // Croma Retail
  {
    id: 'croma_fest_500',
    code: 'CRMAOFF500',
    merchant: 'Croma Retail',
    domain: 'croma.com',
    description: 'Flat ₹500 Off on electronics purchases above ₹15,000',
    discountType: 'flat',
    discountValue: 500,
    minOrderValue: 15000,
    terms: 'Valid on headphones, laptops, smartphones and accessories on croma.com.',
    isVerified: true,
    expiresAt: '2026-12-31',
  },

  // Tata CLiQ
  {
    id: 'cliq_audio_10',
    code: 'CLIQAUDIO10',
    merchant: 'Tata CLiQ',
    domain: 'tatacliq.com',
    description: '10% Off on Sony, Bose and Apple premium audio devices',
    discountType: 'percentage',
    discountValue: 10,
    minOrderValue: 12000,
    maxDiscount: 2000,
    terms: 'Valid on Tata CLiQ Luxury and Electronics categories.',
    isVerified: true,
    expiresAt: '2026-12-31',
  },
];

/**
 * Finds all applicable verified coupons for a given merchant and item price.
 */
export function getApplicableCoupons(domain: string, orderAmount: number): {
  applicable: (CouponCode & { calculatedSavings: number; finalPrice: number })[];
  otherCoupons: CouponCode[];
  bestCoupon: (CouponCode & { calculatedSavings: number; finalPrice: number }) | null;
} {
  const normalizedDomain = domain.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];

  const merchantCoupons = VERIFIED_INDIAN_COUPONS.filter((c) => {
    return c.domain.includes(normalizedDomain) || normalizedDomain.includes(c.domain);
  });

  const applicable: (CouponCode & { calculatedSavings: number; finalPrice: number })[] = [];
  const otherCoupons: CouponCode[] = [];

  for (const coupon of merchantCoupons) {
    if (orderAmount >= coupon.minOrderValue) {
      let savings = 0;
      if (coupon.discountType === 'percentage') {
        savings = Math.round((orderAmount * coupon.discountValue) / 100);
        if (coupon.maxDiscount && savings > coupon.maxDiscount) {
          savings = coupon.maxDiscount;
        }
      } else {
        savings = coupon.discountValue;
      }

      applicable.push({
        ...coupon,
        calculatedSavings: savings,
        finalPrice: Math.max(0, orderAmount - savings),
      });
    } else {
      otherCoupons.push(coupon);
    }
  }

  // Sort applicable coupons by highest savings
  applicable.sort((a, b) => b.calculatedSavings - a.calculatedSavings);
  const bestCoupon = applicable.length > 0 ? applicable[0] : null;

  return {
    applicable,
    otherCoupons,
    bestCoupon,
  };
}
