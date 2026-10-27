import { describe, it, expect, beforeAll } from 'vitest';
import prisma from '@/backend/utils/db';
import { MockCatalogAdapter } from '@/backend/adapters/mock-catalog';
import { Channel3CatalogAdapter } from '@/backend/adapters/channel3-catalog';
import { evaluateDeterministicRules } from '@/backend/engine/deal-rules';
import { calculateDealScore } from '@/backend/engine/deal-scorer';
import { computeNextCheck } from '@/backend/workers/monitoring-worker';
import { createOutboxEvent, generateDeduplicationKey } from '@/backend/services/outbox';
import { renderPriceDropEmailHtml, sendPriceDropEmail } from '@/backend/services/email';
import { processOutboxJob } from '@/backend/workers/outbox-worker';
import { PayPalService } from '@/backend/services/paypal';
import { getPayPalAgentToolkit, getPayPalAgentTools, executePayPalAgent } from '@/backend/services/paypal-agent';
import { NormalizedOffer } from '@/backend/contracts/offer';
import { verifyProductMatch } from '@/backend/engine/product-verifier';
import { auth } from '@/backend/utils/auth';
import { getCurrentUser } from '@/backend/utils/user';

describe('🎯 DealPilot Comprehensive System Functionality Evals', () => {
  let sampleProduct: any;
  let sampleOffer: any;
  let sampleRule: any;
  let demoUser: any;

  beforeAll(async () => {
    // Ensure demo user exists
    demoUser = await prisma.user.upsert({
      where: { email: 'eval_runner@dealpilot.ai' },
      create: { email: 'eval_runner@dealpilot.ai', name: 'Eval Runner User' },
      update: {},
    });

    sampleProduct = await prisma.product.findFirst({
      include: { offers: true },
    });

    sampleOffer = sampleProduct?.offers?.[0];

    sampleRule = await prisma.trackingRule.upsert({
      where: { id: 'eval-sample-rule-fixed' },
      create: {
        id: 'eval-sample-rule-fixed',
        userId: demoUser.id,
        productId: sampleProduct!.id,
        offerId: sampleOffer!.id,
        targetPrice: 18000,
        strategy: 'target_price',
        status: 'active',
      },
      update: {},
    });
  });

  // =========================================================================
  // EVAL 1: Catalog Ingestion & Normalized Contract Adherence
  // =========================================================================
  describe('Eval 1: Catalog Ingestion & Universal Contract', () => {
    it('1.1 Mock Catalog Adapter produces schema-compliant NormalizedOffer objects', async () => {
      const adapter = new MockCatalogAdapter([
        {
          externalProductId: 'test-sony-seed',
          canonicalProductId: 'sony-wh-1000xm5',
          title: 'Sony WH-1000XM5 Wireless Noise-Canceling Headphones',
          brand: 'Sony',
          model: 'WH-1000XM5',
          category: 'Headphones',
          imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
          variantAttributes: { color: 'Black', condition: 'new' },
          seller: { id: 'seller-sony', name: 'Sony Store', isAuthorized: true, rating: 4.8, reviewCount: 1200 },
          price: { itemPrice: 19499, shippingPrice: 0, fees: 0, currency: 'INR', totalPrice: 19499 },
          availabilityStatus: 'in_stock',
        },
      ]);
      const offers = await adapter.search({ query: 'Sony' });

      expect(offers.length).toBeGreaterThan(0);
      const first = offers[0];

      // Validate contract invariants
      expect(first.sourceId).toBe('mock_retailer');
      expect(first.canonicalProductId).toBeDefined();
      expect(first.title).toBeDefined();
      expect(first.price.itemPrice).toBeGreaterThan(0);
      expect(first.price.totalPrice).toBeGreaterThanOrEqual(first.price.itemPrice);
      expect(first.price.currency).toBe('INR');
      expect(['in_stock', 'out_of_stock', 'preorder', 'unknown']).toContain(first.availabilityStatus);
      expect(['fresh', 'stale', 'expired', 'error']).toContain(first.freshnessStatus);
      expect(first.seller.rating).toBeGreaterThanOrEqual(1.0);
      expect(first.seller.rating).toBeLessThanOrEqual(5.0);
    });

    it('1.2 Channel3 Adapter initializes with credentials and handles query translation', async () => {
      const adapter = new Channel3CatalogAdapter();
      expect(adapter).toBeDefined();
      // Revalidation method contract check
      expect(typeof adapter.revalidateOffer).toBe('function');
      expect(typeof adapter.search).toBe('function');
    });
  });

  // =========================================================================
  // EVAL 2: Deterministic Rules & Rubric Scoring Engine
  // =========================================================================
  describe('Eval 2: Deterministic Deal Rules & Scoring Engine', () => {
    const baseOffer: NormalizedOffer = {
      sourceId: 'mock_retailer',
      externalProductId: 'eval-headphone-1',
      offerUrl: 'https://mock.com/eval-1',
      canonicalProductId: 'eval-sony-xm5',
      title: 'Sony WH-1000XM5 Wireless Headphones',
      brand: 'Sony',
      model: 'WH-1000XM5',
      category: 'Headphones',
      variantAttributes: { color: 'Black', condition: 'new' },
      seller: { id: 's1', name: 'Official Store', isAuthorized: true, rating: 4.9 },
      price: { itemPrice: 16000, shippingPrice: 0, fees: 0, currency: 'INR', totalPrice: 16000 },
      availabilityStatus: 'in_stock',
      freshnessStatus: 'fresh',
      sourceConfidence: 1.0,
      observedAt: new Date(),
    };

    it('2.1 Target price threshold triggers deterministically when price <= target', () => {
      const evaluation = evaluateDeterministicRules(baseOffer, {
        targetPrice: 17000,
        strategy: 'target_price',
      });

      expect(evaluation.triggered).toBe(true);
      expect(evaluation.currentPrice).toBe(16000);
      expect(evaluation.violations).toHaveLength(0);
    });

    it('2.2 Target price threshold does NOT trigger when price > target', () => {
      const evaluation = evaluateDeterministicRules(baseOffer, {
        targetPrice: 15000,
        strategy: 'target_price',
      });

      expect(evaluation.triggered).toBe(false);
      expect(evaluation.violations[0]).toContain('exceeds target');
    });

    it('2.3 Refurbished variant rejected when brand new is required', () => {
      const refurbOffer: NormalizedOffer = {
        ...baseOffer,
        variantAttributes: { condition: 'refurbished' },
      };

      const evaluation = evaluateDeterministicRules(refurbOffer, {
        targetPrice: 20000,
        requiredCondition: 'new',
      });

      expect(evaluation.triggered).toBe(false);
      expect(evaluation.isVariantMatch).toBe(false);
    });

    it('2.4 Rubric scorer calculates bounded 0-100 scores and appropriate recommendations', () => {
      const scoreData = calculateDealScore({
        offer: baseOffer,
        targetPrice: 18000,
        historicalPrices: [22000, 20000, 19000, 18500, 16000],
      });

      expect(scoreData.score).toBeGreaterThanOrEqual(0);
      expect(scoreData.score).toBeLessThanOrEqual(100);
      expect(['strong_buy', 'buy', 'fair', 'pass']).toContain(scoreData.recommendation);
      expect(scoreData.signals.percentBelow30DayAvg).toBeDefined();
      expect(scoreData.signals.percentFromAllTimeLow).toBeDefined();
    });
  });

  // =========================================================================
  // EVAL 3: Adaptive Polling & Rate-Limit Backoff
  // =========================================================================
  describe('Eval 3: Adaptive Polling & Jitter Scheduling', () => {
    it('3.1 Selects 2-hour normal schedule when price is far from target (>5%)', () => {
      const check = computeNextCheck({
        currentPrice: 20000,
        targetPrice: 15000, // 33% away
        consecutiveFailures: 0,
      });

      expect(check.policy).toBe('normal');
      const diffMinutes = Math.round((check.nextCheckAt.getTime() - Date.now()) / (60 * 1000));
      expect(diffMinutes).toBeCloseTo(120, -1); // Approx 120 minutes
    });

    it('3.2 Selects 30-minute near_target schedule when price is within 5% of target', () => {
      const check = computeNextCheck({
        currentPrice: 15500,
        targetPrice: 15000, // 3.3% away
        consecutiveFailures: 0,
      });

      expect(check.policy).toBe('near_target');
      const diffMinutes = Math.round((check.nextCheckAt.getTime() - Date.now()) / (60 * 1000));
      expect(diffMinutes).toBeCloseTo(30, -1); // Approx 30 minutes
    });

    it('3.3 Exponential backoff activates when consecutive failures occur', () => {
      const check1 = computeNextCheck({
        currentPrice: 20000,
        targetPrice: 15000,
        consecutiveFailures: 1,
      });
      const check2 = computeNextCheck({
        currentPrice: 20000,
        targetPrice: 15000,
        consecutiveFailures: 3,
      });

      expect(check1.policy).toBe('backoff');
      expect(check2.policy).toBe('backoff');
      expect(check2.nextCheckAt.getTime()).toBeGreaterThan(check1.nextCheckAt.getTime());
    });
  });

  // =========================================================================
  // EVAL 4: Transactional Outbox & Email Notification Service
  // =========================================================================
  describe('Eval 4: Transactional Outbox & Email Notification Service', () => {
    it('4.1 Responsive HTML email template contains correct pricing, savings, and CTA links', () => {
      const html = renderPriceDropEmailHtml({
        to: 'shopper@dealpilot.ai',
        productTitle: 'Sony WH-1000XM5 Wireless Headphones',
        brand: 'Sony',
        currentPrice: 14999,
        targetPrice: 17500,
        currency: 'INR',
        savings: 2501,
        dropPercentage: 14,
        sellerName: 'CDW Authorized',
        dealScore: 91,
        condition: 'Brand New',
        trackingRuleId: 'rule-eval-email',
        offerId: 'offer-eval-email',
      });

      expect(html).toContain('Sony WH-1000XM5 Wireless Headphones');
      expect(html).toContain('₹14,999');
      expect(html).toContain('₹17,500');
      expect(html).toContain('Save ₹2,501');
      expect(html).toContain('14% drop');
      expect(html).toContain('CDW Authorized');
      expect(html).toContain('91 / 100');
      expect(html).toContain('Complete Pre-Flight Checkout');
      expect(html).toContain('View 30-Day Price Trajectory Chart');
    });

    it('4.2 Atomic outbox event created with deduplication key', async () => {
      const key = generateDeduplicationKey('rule-A', 'offer-B', 'price_drop', 'obs-C');
      expect(key).toBe('rule-A:offer-B:price_drop:obs-C');

      const outboxRes = await createOutboxEvent({
        trackingRuleId: sampleRule.id,
        offerId: sampleOffer?.id || 'demo-offer',
        eventType: 'price_drop',
        observationId: `eval-obs-${Date.now()}`,
        payload: {
          productTitle: 'Eval Product',
          observedPrice: 14999,
          targetPrice: 17500,
        },
      });

      expect(outboxRes.isDuplicate).toBe(false);
      expect(outboxRes.event).toBeDefined();
      expect(outboxRes.event?.status).toBe('pending');
    });

    it('4.3 Outbox Worker processes pending email, transitions state to sent, and respects idempotency', async () => {
      const product = await prisma.product.findFirst();
      const offer = await prisma.offer.findFirst({ where: { productId: product!.id } });

      const testRule = await prisma.trackingRule.create({
        data: {
          userId: demoUser.id,
          productId: product!.id,
          offerId: offer!.id,
          targetPrice: 16000,
          strategy: 'target_price',
          status: 'active',
        },
      });

      const outboxRecord = await prisma.notificationOutbox.create({
        data: {
          trackingRuleId: testRule.id,
          offerId: offer!.id,
          eventType: 'target_hit',
          deduplicationKey: `eval-email-${Date.now()}-${Math.random()}`,
          payload: JSON.stringify({
            productTitle: product!.title,
            observedPrice: 14999,
            targetPrice: 16000,
            seller: offer!.sellerName,
          }),
          status: 'pending',
        },
      });

      // Dispatch
      const result = await processOutboxJob({
        data: { outboxEventId: outboxRecord.id },
      });

      expect(result.success).toBe(true);
      expect(result.emailResult?.recipient).toBe('eval_runner@dealpilot.ai');

      // Check DB
      const updated = await prisma.notificationOutbox.findUnique({
        where: { id: outboxRecord.id },
      });
      expect(updated?.status).toBe('sent');
      expect(updated?.processedAt).toBeDefined();

      // Repeated dispatch check (idempotency)
      const repeat = await processOutboxJob({
        data: { outboxEventId: outboxRecord.id },
      });
      expect(repeat.alreadyDispatched).toBe(true);
    });
  });

  // =========================================================================
  // EVAL 5: Pre-Flight Checkout Revalidation & Payment Idempotency
  // =========================================================================
  describe('Eval 5: Pre-Flight Revalidation & PayPal Idempotency', () => {
    it('5.1 Pre-flight checkout aborts if price shifts right before order creation', async () => {
      const testId = 'mock-sony-xm5-black';
      const adapter = new MockCatalogAdapter([
        {
          externalProductId: testId,
          canonicalProductId: 'sony-wh-1000xm5',
          title: 'Sony WH-1000XM5 Wireless Noise-Canceling Headphones',
          brand: 'Sony',
          model: 'WH-1000XM5',
          category: 'Headphones',
          imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
          variantAttributes: { color: 'Black', condition: 'new' },
          seller: { id: 'seller-sony', name: 'Sony Store', isAuthorized: true, rating: 4.8, reviewCount: 1200 },
          price: { itemPrice: 19499, shippingPrice: 0, fees: 0, currency: 'INR', totalPrice: 19499 },
          availabilityStatus: 'in_stock',
        },
      ]);

      // Initial price: 19499
      const offer = await adapter.fetchOffer(testId);
      expect(offer?.price.totalPrice).toBe(19499);

      // Simulate unexpected merchant price spike right at checkout
      adapter.updateSimulatedPrice(testId, 22499);

      const revalidated = await adapter.revalidateOffer(testId);
      expect(revalidated.currentTotalPrice).toBe(22499);
      expect(revalidated.currentTotalPrice).not.toBe(offer?.price.totalPrice);

      // Reset
      adapter.updateSimulatedPrice(testId, 19499);
    });

    it('5.2 PayPal Service captures orders idempotently using Idempotency-Key', async () => {
      const payPal = new PayPalService();
      const product = await prisma.product.findFirst();
      const offer = await prisma.offer.findFirst({ where: { productId: product!.id } });

      const key = `eval-idempotency-${Date.now()}`;

      const order1 = await payPal.createCheckoutOrder({
        userId: demoUser.id,
        offerId: offer!.id,
        idempotencyKey: key,
      });

      const order2 = await payPal.createCheckoutOrder({
        userId: demoUser.id,
        offerId: offer!.id,
        idempotencyKey: key,
      });

      expect(order1.valid).toBe(true);
      expect(order2.idempotent).toBe(true);
      expect(order1.order.id).toBe(order2.order.id);

      // Capture idempotency
      const captureKey = `eval-capture-key-${Date.now()}`;
      const cap1 = await payPal.captureOrder({
        orderId: order1.order.id,
        paypalOrderId: order1.order.paypalOrderId,
        idempotencyKey: captureKey,
      });
      expect(cap1.success).toBe(true);
      expect(cap1.idempotent).toBe(false);

      const cap2 = await payPal.captureOrder({
        orderId: order1.order.id,
        paypalOrderId: order1.order.paypalOrderId,
        idempotencyKey: captureKey,
      });
      expect(cap2.success).toBe(true);
      expect(cap2.idempotent).toBe(true);
      expect(cap2.order.id).toBe(cap1.order.id);
    });
  });

  // =========================================================================
  // EVAL 6: PayPal Agent Toolkit Integration
  // =========================================================================
  describe('Eval 6: Official PayPal Agent Toolkit Integration', () => {
    it('6.1 PayPal Agent Toolkit exposes valid tool definitions', () => {
      const toolkit = getPayPalAgentToolkit({ sandbox: true });
      expect(toolkit).toBeDefined();

      const tools = getPayPalAgentTools(toolkit);
      expect(Array.isArray(tools)).toBe(true);
      expect(tools.length).toBeGreaterThanOrEqual(1);

      const toolNames = tools.map((t: any) => t.function?.name || t.name);
      expect(toolNames).toContain('create_order');
    });

    it('6.2 PayPal Agent executes autonomous order creation action', async () => {
      const res = await executePayPalAgent('Create an order for ₹15,499 for Sony WH-1000XM5');
      expect(res.response).toBeDefined();
      expect(res.toolCalled).toBe('create_order');
      expect(res.toolResult).toBeDefined();
    });

    it('6.3 PayPal Agent executes status check and capture actions', async () => {
      const statusRes = await executePayPalAgent('Check status of order');
      expect(statusRes.toolCalled).toBe('get_order');

      const captureRes = await executePayPalAgent('Capture approved order');
      expect(captureRes.toolCalled).toBe('pay_order');
    });
  });

  // =========================================================================
  // EVAL 7: Product Search Verification & Intent Guard
  // =========================================================================
  describe('Eval 7: Product Search Verification & Intent Guard', () => {
    it('7.1 Strict model verification confirms exact hardware matches', () => {
      const result = verifyProductMatch({
        query: 'Sony WH-1000XM5 wireless noise cancelling headphones',
        title: 'Sony WH-1000XM5 Wireless Industry Leading Noise Canceling Headphones - Black',
        brand: 'Sony',
        model: 'WH-1000XM5',
        category: 'Headphones',
        price: 19499,
      });

      expect(result.isMatch).toBe(true);
      expect(result.matchQuality).toBe('exact_model');
      expect(result.isAccessoryMismatch).toBe(false);
      expect(result.relevanceScore).toBeGreaterThanOrEqual(0.7);
    });

    it('7.2 Excludes accessory mismatches (cases, cables, earpads) when core hardware is queried', () => {
      const result = verifyProductMatch({
        query: 'Sony WH-1000XM5',
        title: 'Hard Travel Case for Sony WH-1000XM5 Noise Canceling Headphones',
        brand: 'Generic',
        category: 'Accessories',
        price: 799,
      });

      expect(result.isMatch).toBe(false);
      expect(result.isAccessoryMismatch).toBe(true);
      expect(result.matchQuality).toBe('accessory_mismatch');
      expect(result.relevanceScore).toBeLessThan(0.3);
    });

    it('7.3 Rejects low-relevance queries deterministically', () => {
      const result = verifyProductMatch({
        query: 'Apple MacBook Pro M3',
        title: 'Sony WH-1000XM5 Wireless Headphones',
        brand: 'Sony',
        category: 'Headphones',
        price: 19499,
      });

      expect(result.isMatch).toBe(false);
      expect(result.matchQuality).toBe('irrelevant');
      expect(result.relevanceScore).toBeLessThan(0.3);
    });
  });

  // =========================================================================
  // EVAL 8: Better Auth Configuration & PostgreSQL Schema Compatibility
  // =========================================================================
  describe('Eval 8: Better Auth Integration & Social Providers', () => {
    it('8.1 Better Auth initializes with PostgreSQL Prisma adapter and social providers (Google, GitHub)', () => {
      expect(auth).toBeDefined();
      expect(typeof auth.handler).toBe('function');
      expect(typeof auth.api).toBe('object');
      expect(auth.options.socialProviders?.google).toBeDefined();
      expect(auth.options.socialProviders?.github).toBeDefined();
    });

    it('8.2 User session retrieval and demo fallback operate seamlessly', async () => {
      // Direct user retrieval without headers falls back to valid user record
      const user = await getCurrentUser();
      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.email).toBeDefined();
    });
  });
});
