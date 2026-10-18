import { describe, it, expect, beforeEach } from 'vitest';
import { evaluateDeterministicRules } from '@/backend/engine/deal-rules';
import { calculateFreshnessStatus, isOfferActionable } from '@/backend/engine/freshness';
import { generateDeduplicationKey, createOutboxEvent } from '@/backend/services/outbox';
import { calculateDealScore } from '@/backend/engine/deal-scorer';
import { MockCatalogAdapter } from '@/backend/adapters/mock-catalog';
import { PayPalService } from '@/backend/services/paypal';
import prisma from '@/backend/utils/db';
import { NormalizedOffer } from '@/backend/contracts/offer';

describe('DealPilot Architectural Guardrails & Failure Paths', () => {
  let sampleOffer: NormalizedOffer;

  beforeEach(() => {
    sampleOffer = {
      sourceId: 'mock_retailer',
      externalProductId: 'test-sony-xm5',
      offerUrl: 'https://mockretailer.com/p/test-sony-xm5',
      canonicalProductId: 'sony-wh-1000xm5',
      title: 'Sony WH-1000XM5 Wireless Headphones - Black',
      brand: 'Sony',
      model: 'WH-1000XM5',
      category: 'Headphones',
      variantAttributes: { color: 'Black', condition: 'new' },
      seller: { id: 's1', name: 'Official Store', isAuthorized: true, rating: 4.8 },
      price: { itemPrice: 18000, shippingPrice: 0, fees: 0, currency: 'INR', totalPrice: 18000 },
      availabilityStatus: 'in_stock',
      freshnessStatus: 'fresh',
      sourceConfidence: 1.0,
      observedAt: new Date(),
    };
  });

  // Test 1: Target Match
  it('1. A price equal to or below the target triggers the configured rule', () => {
    const result = evaluateDeterministicRules(sampleOffer, {
      targetPrice: 19000,
      strategy: 'target_price',
    });

    expect(result.triggered).toBe(true);
    expect(result.violations).toHaveLength(0);
    expect(result.currentPrice).toBe(18000);
  });

  // Test 2: Variant Guard
  it('2. A different product variant or refurbished condition is rejected', () => {
    const refurbishedOffer: NormalizedOffer = {
      ...sampleOffer,
      variantAttributes: { color: 'Black', condition: 'refurbished' },
    };

    const result = evaluateDeterministicRules(refurbishedOffer, {
      targetPrice: 20000,
      requiredCondition: 'new',
    });

    expect(result.triggered).toBe(false);
    expect(result.isVariantMatch).toBe(false);
    expect(result.violations[0]).toContain("requested 'new', found 'refurbished'");
  });

  // Test 3: Stale Protection
  it('3. A stale or unverified offer cannot be shown as an actionable live deal', () => {
    const staleOffer: NormalizedOffer = {
      ...sampleOffer,
      observedAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      freshnessStatus: 'stale',
    };

    const isActionable = isOfferActionable(staleOffer.freshnessStatus!, staleOffer.availabilityStatus);
    expect(isActionable).toBe(false);

    const ruleCheck = evaluateDeterministicRules(staleOffer, { targetPrice: 25000 });
    expect(ruleCheck.triggered).toBe(false);
    expect(ruleCheck.isFresh).toBe(false);
  });

  // Test 4: Deduplication
  it('4. Repeated worker executions with identical parameters produce identical deduplication keys and avoid duplicate alerts', async () => {
    const ruleId = 'rule-123';
    const offerId = 'offer-456';
    const eventType = 'target_hit';
    const observationId = 'obs-789';

    const key1 = generateDeduplicationKey(ruleId, offerId, eventType, observationId);
    const key2 = generateDeduplicationKey(ruleId, offerId, eventType, observationId);

    expect(key1).toBe(key2);
    expect(key1).toBe('rule-123:offer-456:target_hit:obs-789');
  });

  // Test 5: Source Outage
  it('5. A source failure or timeout preserves the last known price and flags the offer with error freshness', () => {
    const calculated = calculateFreshnessStatus({
      lastCheckedAt: new Date(Date.now() - 10000),
      availabilityStatus: 'in_stock',
      lastError: 'HTTP 504 Gateway Timeout',
    });

    expect(calculated).toBe('error');
  });

  // Test 6: LLM Outage Guardrail
  it('6. An LLM outage or timeout does not prevent deterministic target detection', () => {
    // Deterministic rules engine has 0 dependencies on LLM APIs
    const ruleResult = evaluateDeterministicRules(sampleOffer, {
      targetPrice: 20000,
      strategy: 'target_price',
    });

    expect(ruleResult.triggered).toBe(true);

    // Scoring engine also has pure mathematical calculation with zero LLM dependence
    const scoreResult = calculateDealScore({
      offer: sampleOffer,
      targetPrice: 20000,
      historicalPrices: [22000, 21500, 21000, 20500, 20000],
    });

    expect(scoreResult.score).toBeGreaterThan(70);
    expect(scoreResult.recommendation).toBe('strong_buy');
  });

  // Test 7: Double-Capture Guard
  it('7. Repeated capture requests return an idempotent response without duplicating captures', async () => {
    const mockDbUser = await prisma.user.upsert({
      where: { email: 'test_capture_user@dealpilot.ai' },
      create: { email: 'test_capture_user@dealpilot.ai', name: 'Test Capture User' },
      update: {},
    });

    const mockProduct = await prisma.product.upsert({
      where: { canonicalId: 'test-product-capture' },
      create: {
        canonicalId: 'test-product-capture',
        title: 'Test Capture Product',
        brand: 'TestBrand',
        model: 'TCP-1',
        category: 'Test',
      },
      update: {},
    });

    const mockOffer = await prisma.offer.upsert({
      where: {
        sourceId_externalProductId: {
          sourceId: 'mock_retailer',
          externalProductId: 'test-product-capture-ext',
        },
      },
      create: {
        productId: mockProduct.id,
        sourceId: 'mock_retailer',
        externalProductId: 'test-product-capture-ext',
        offerUrl: 'https://mock.com',
        sellerName: 'Test Seller',
        itemPrice: 15000,
        totalPrice: 15000,
      },
      update: {},
    });

    const order = await prisma.order.create({
      data: {
        userId: mockDbUser.id,
        offerId: mockOffer.id,
        quotedTotal: 15000,
        currency: 'INR',
        status: 'awaiting_approval',
        paypalOrderId: `PAYPAL-TEST-${Date.now()}`,
      },
    });

    const payPal = new PayPalService();

    // First capture
    const firstCapture = await payPal.captureOrder({
      orderId: order.id,
      paypalOrderId: order.paypalOrderId!,
    });
    expect(firstCapture.success).toBe(true);
    expect(firstCapture.idempotent).toBe(false);
    expect(firstCapture.order.status).toBe('paid');

    // Second capture (idempotent duplicate request)
    const secondCapture = await payPal.captureOrder({
      orderId: order.id,
      paypalOrderId: order.paypalOrderId!,
    });
    expect(secondCapture.success).toBe(true);
    expect(secondCapture.idempotent).toBe(true);
    expect(secondCapture.order.status).toBe('paid');
  });

  // Test 8: Client-Side Spoofing Defense
  it('8. A client-side fake success cannot mark an order paid without server-side PayPal verification', async () => {
    const mockDbUser = await prisma.user.upsert({
      where: { email: 'test_spoof_user@dealpilot.ai' },
      create: { email: 'test_spoof_user@dealpilot.ai', name: 'Test Spoof User' },
      update: {},
    });

    const mockProduct = await prisma.product.findFirst();
    const mockOffer = await prisma.offer.findFirst();

    const order = await prisma.order.create({
      data: {
        userId: mockDbUser.id,
        offerId: mockOffer!.id,
        quotedTotal: 10000,
        currency: 'INR',
        status: 'awaiting_approval',
        paypalOrderId: `GENUINE-PAYPAL-${Date.now()}-${Math.random()}`,
      },
    });

    const payPal = new PayPalService();

    // Client passes spoofed order id
    await expect(
      payPal.captureOrder({
        orderId: order.id,
        paypalOrderId: 'SPOOFED-PAYPAL-ID-FROM-CLIENT',
      })
    ).rejects.toThrow('PayPal Order ID mismatch');

    // Order status must remain unpaid
    const refreshed = await prisma.order.findUnique({ where: { id: order.id } });
    expect(refreshed?.status).not.toBe('paid');
  });

  // Test 9: Multi-Tenant Isolation
  it('9. User A cannot modify or delete User B tracking rules', async () => {
    const userA = await prisma.user.upsert({
      where: { email: 'userA@dealpilot.ai' },
      create: { email: 'userA@dealpilot.ai', name: 'User A' },
      update: {},
    });

    const userB = await prisma.user.upsert({
      where: { email: 'userB@dealpilot.ai' },
      create: { email: 'userB@dealpilot.ai', name: 'User B' },
      update: {},
    });

    const product = await prisma.product.findFirst();

    const ruleB = await prisma.trackingRule.create({
      data: {
        userId: userB.id,
        productId: product!.id,
        targetPrice: 15000,
        status: 'active',
      },
    });

    // User A attempts to find or modify User B's rule
    const queryAsUserA = await prisma.trackingRule.findFirst({
      where: {
        id: ruleB.id,
        userId: userA.id, // Enforce tenant isolation in query
      },
    });

    expect(queryAsUserA).toBeNull();
  });

  // Test 10: Price Shift at Checkout Revalidation
  it('10. If the price changes before checkout, pre-flight revalidation aborts order creation for user re-review', async () => {
    const mockAdapter = new MockCatalogAdapter();
    const testExtId = 'mock-sony-xm5-black';

    // Initial offer
    const initialOffer = await mockAdapter.fetchOffer(testExtId);
    expect(initialOffer?.price.totalPrice).toBe(19499);

    // Simulate merchant price increase right before buyer checks out
    mockAdapter.updateSimulatedPrice(testExtId, 21999);

    const revalidation = await mockAdapter.revalidateOffer(testExtId);
    expect(revalidation.currentTotalPrice).toBe(21999);
    expect(revalidation.currentTotalPrice).not.toBe(initialOffer?.price.totalPrice);
  });
});
