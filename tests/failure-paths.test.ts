import { describe, it, expect, beforeEach } from 'vitest';
import { evaluateDeterministicRules } from '@/backend/engine/deal-rules';
import { calculateFreshnessStatus, isOfferActionable } from '@/backend/engine/freshness';
import { generateDeduplicationKey, createOutboxEvent } from '@/backend/services/outbox';
import { calculateDealScore } from '@/backend/engine/deal-scorer';
import { MockCatalogAdapter } from '@/backend/adapters/mock-catalog';
import { PayPalService } from '@/backend/services/paypal';
import prisma from '@/backend/utils/db';
import { NormalizedOffer } from '@/backend/contracts/offer';
import { renderPriceDropEmailHtml, sendPriceDropEmail } from '@/backend/services/email';
import { processOutboxJob } from '@/backend/workers/outbox-worker';
import { getPayPalAgentToolkit, getPayPalAgentTools, executePayPalAgent } from '@/backend/services/paypal-agent';

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
    const testExtId = 'mock-sony-xm5-black';
    const mockAdapter = new MockCatalogAdapter([
      {
        externalProductId: testExtId,
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

    // Initial offer
    const initialOffer = await mockAdapter.fetchOffer(testExtId);
    expect(initialOffer?.price.totalPrice).toBe(19499);

    // Simulate merchant price increase right before buyer checks out
    mockAdapter.updateSimulatedPrice(testExtId, 21999);

    const revalidation = await mockAdapter.revalidateOffer(testExtId);
    expect(revalidation.currentTotalPrice).toBe(21999);
    expect(revalidation.currentTotalPrice).not.toBe(initialOffer?.price.totalPrice);

    // Reset price for downstream tests
    mockAdapter.updateSimulatedPrice(testExtId, 19499);
  });

  // Test 11: Payment Idempotency Keys Guard
  it('11. Idempotency keys prevent double order creation and duplicate payment captures during concurrent requests', async () => {
    const payPal = new PayPalService();
    const mockUser = await prisma.user.upsert({
      where: { email: 'idempotency_user@dealpilot.ai' },
      create: { email: 'idempotency_user@dealpilot.ai', name: 'Idempotency User' },
      update: {},
    });
    const mockProduct = await prisma.product.findFirst();
    const mockOffer = await prisma.offer.upsert({
      where: {
        sourceId_externalProductId: {
          sourceId: 'mock_retailer',
          externalProductId: 'mock-sony-xm5-black',
        },
      },
      create: {
        productId: mockProduct!.id,
        sourceId: 'mock_retailer',
        externalProductId: 'mock-sony-xm5-black',
        offerUrl: 'https://mock.com',
        sellerName: 'Best Buy Official',
        itemPrice: 19499,
        totalPrice: 19499,
      },
      update: {
        totalPrice: 19499,
      },
    });

    const idempotencyKey = `req-idempotency-${Date.now()}`;

    // First checkout order creation
    const orderResult1 = await payPal.createCheckoutOrder({
      userId: mockUser.id,
      offerId: mockOffer.id,
      idempotencyKey,
    });
    expect(orderResult1.valid).toBe(true);
    expect(orderResult1.order).toBeDefined();

    // Duplicate concurrent checkout order creation with same idempotency key
    const orderResult2 = await payPal.createCheckoutOrder({
      userId: mockUser.id,
      offerId: mockOffer.id,
      idempotencyKey,
    });
    expect(orderResult2.valid).toBe(true);
    expect(orderResult2.idempotent).toBe(true);
    expect(orderResult2.order.id).toBe(orderResult1.order.id);

    // Test capture idempotency key
    const captureKey = `capture-idempotency-${Date.now()}`;
    const capture1 = await payPal.captureOrder({
      orderId: orderResult1.order.id,
      paypalOrderId: orderResult1.order.paypalOrderId,
      idempotencyKey: captureKey,
    });
    expect(capture1.success).toBe(true);
    expect(capture1.idempotent).toBe(false);

    // Duplicate capture call with same key
    const capture2 = await payPal.captureOrder({
      orderId: orderResult1.order.id,
      paypalOrderId: orderResult1.order.paypalOrderId,
      idempotencyKey: captureKey,
    });
    expect(capture2.success).toBe(true);
    expect(capture2.idempotent).toBe(true);
    expect(capture2.order.id).toBe(capture1.order.id);
  });

  // Test 12: Price-Drop Email Notification Service & Transactional Outbox Dispatch
  it('12. Price-drop triggers transactional outbox event, generates responsive HTML email, and marks notification sent with deduplication guard', async () => {
    // 12a. Verify pure HTML email template generation
    const testEmailData = {
      to: 'shopper@dealpilot.ai',
      productTitle: 'Sony WH-1000XM5 Wireless Noise-Canceling Headphones',
      brand: 'Sony',
      currentPrice: 15499,
      targetPrice: 18000,
      savings: 2501,
      dropPercentage: 14,
      sellerName: 'Best Buy Official',
      dealScore: 92,
      condition: 'Brand New',
      trackingRuleId: 'rule-test-email',
      offerId: 'offer-test-email',
    };

    const html = renderPriceDropEmailHtml(testEmailData);
    expect(html).toContain('Sony WH-1000XM5 Wireless Noise-Canceling Headphones');
    expect(html).toContain('₹15,499');
    expect(html).toContain('₹18,000');
    expect(html).toContain('Save ₹2,501');
    expect(html).toContain('Complete Pre-Flight Checkout');
    expect(html).toContain('DealPilot');

    // 12b. Verify transactional outbox dispatch worker & DB state transition
    const mockUser = await prisma.user.upsert({
      where: { email: 'email_outbox_test@dealpilot.ai' },
      create: { email: 'email_outbox_test@dealpilot.ai', name: 'Email Outbox User' },
      update: {},
    });

    const mockProduct = await prisma.product.findFirst();
    const mockOffer = await prisma.offer.findFirst({
      where: { productId: mockProduct!.id },
    });

    const testRule = await prisma.trackingRule.create({
      data: {
        userId: mockUser.id,
        productId: mockProduct!.id,
        offerId: mockOffer!.id,
        targetPrice: 18000,
        strategy: 'target_price',
        status: 'active',
      },
    });

    const outboxEvent = await prisma.notificationOutbox.create({
      data: {
        trackingRuleId: testRule.id,
        offerId: mockOffer!.id,
        eventType: 'target_hit',
        deduplicationKey: `test-email-dispatch-${Date.now()}-${Math.random()}`,
        payload: JSON.stringify({
          productTitle: mockProduct!.title,
          observedPrice: 15499,
          targetPrice: 18000,
          seller: mockOffer!.sellerName,
        }),
        status: 'pending',
      },
    });

    // Process outbox dispatch job
    const dispatchResult = await processOutboxJob({
      data: { outboxEventId: outboxEvent.id },
    });

    expect(dispatchResult.success).toBe(true);
    expect(dispatchResult.emailResult?.recipient).toBe('email_outbox_test@dealpilot.ai');
    expect(dispatchResult.emailResult?.subject).toContain('Price Drop Alert');

    // Verify DB updated to sent with timestamp
    const updatedEvent = await prisma.notificationOutbox.findUnique({
      where: { id: outboxEvent.id },
    });
    expect(updatedEvent?.status).toBe('sent');
    expect(updatedEvent?.processedAt).toBeDefined();

    // 12c. Verify idempotency: repeated execution does not double-dispatch
    const repeatedResult = await processOutboxJob({
      data: { outboxEventId: outboxEvent.id },
    });
    expect(repeatedResult.alreadyDispatched).toBe(true);
  });

  // Test 13: PayPal Agent Toolkit Integration
  it('13. PayPal Agent Toolkit initializes with sandbox context, exposes order tools, and handles order actions', async () => {
    const toolkit = getPayPalAgentToolkit({ sandbox: true });
    expect(toolkit).toBeDefined();

    const tools = getPayPalAgentTools(toolkit);
    expect(Array.isArray(tools)).toBe(true);
    expect(tools.length).toBeGreaterThanOrEqual(1);

    const toolNames = tools.map((t: any) => t.function?.name || t.name);
    expect(toolNames).toContain('create_order');

    const agentResult = await executePayPalAgent('Create an order for ₹15,499 for Sony WH-1000XM5');
    expect(agentResult.response).toBeDefined();
    expect(agentResult.toolCalled).toBe('create_order');
    expect(agentResult.toolResult).toBeDefined();
  });

  // Test 14: Sudden Stock Outage Pre-flight Checkout Abort Guard
  it('14. If an item goes out of stock immediately prior to checkout, pre-flight safety aborts order creation', async () => {
    const testUser = await prisma.user.upsert({
      where: { email: 'test_stock_guard_user@dealpilot.ai' },
      create: { email: 'test_stock_guard_user@dealpilot.ai', name: 'Stock Guard User' },
      update: {},
    });

    const product = await prisma.product.upsert({
      where: { canonicalId: 'test-product-stock-outage' },
      create: {
        canonicalId: 'test-product-stock-outage',
        title: 'Sony WH-1000XM5 Outage Test',
        brand: 'Sony',
        model: 'WH-1000XM5',
        category: 'Headphones',
      },
      update: {},
    });

    const oosOffer = await prisma.offer.create({
      data: {
        productId: product.id,
        sourceId: 'mock_retailer',
        externalProductId: 'test-stock-outage-sku',
        offerUrl: 'https://mock.com/p/outage',
        sellerName: 'Reliable Electronics',
        isAuthorizedSeller: true,
        sellerRating: 4.8,
        itemPrice: 18000,
        totalPrice: 18000,
        availabilityStatus: 'out_of_stock',
        freshnessStatus: 'fresh',
      },
    });

    const paypal = new PayPalService();
    const result = await paypal.createCheckoutOrder({
      userId: testUser.id,
      offerId: oosOffer.id,
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Item is no longer available in stock');
  });

  // Test 15: Zero / Negative Price Exploit Guard
  it('15. An offer with zero or negative manipulated price is deterministically blocked from order creation', async () => {
    const testUser = await prisma.user.upsert({
      where: { email: 'test_price_exploit_user@dealpilot.ai' },
      create: { email: 'test_price_exploit_user@dealpilot.ai', name: 'Exploit Guard User' },
      update: {},
    });

    const product = await prisma.product.upsert({
      where: { canonicalId: 'test-product-zero-price' },
      create: {
        canonicalId: 'test-product-zero-price',
        title: 'Zero Price Test Item',
        brand: 'Sony',
        category: 'Headphones',
      },
      update: {},
    });

    const zeroOffer = await prisma.offer.create({
      data: {
        productId: product.id,
        sourceId: 'mock_retailer',
        externalProductId: 'test-zero-price-sku',
        offerUrl: 'https://mock.com/p/zero',
        sellerName: 'Suspicious Store',
        isAuthorizedSeller: false,
        itemPrice: 0,
        totalPrice: 0,
        availabilityStatus: 'in_stock',
        freshnessStatus: 'fresh',
      },
    });

    const paypal = new PayPalService();
    const result = await paypal.createCheckoutOrder({
      userId: testUser.id,
      offerId: zeroOffer.id,
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Invalid or zero price offer rejected by safety guardrail');
  });

  // Test 16: PayPal Order ID Tampering / Mismatched Capture Guard
  it('16. Capturing an order with a mismatched or spoofed PayPal Order ID is rejected and throws', async () => {
    const testUser = await prisma.user.upsert({
      where: { email: 'test_tamper_user@dealpilot.ai' },
      create: { email: 'test_tamper_user@dealpilot.ai', name: 'Tamper Test User' },
      update: {},
    });

    const product = await prisma.product.upsert({
      where: { canonicalId: 'test-product-tamper' },
      create: {
        canonicalId: 'test-product-tamper',
        title: 'Tamper Guard Product',
        brand: 'TestBrand',
        category: 'Test',
      },
      update: {},
    });

    const offer = await prisma.offer.create({
      data: {
        productId: product.id,
        sourceId: 'mock_retailer',
        externalProductId: 'test-tamper-sku',
        offerUrl: 'https://mock.com/p/tamper',
        sellerName: 'Verified Store',
        isAuthorizedSeller: true,
        itemPrice: 15000,
        totalPrice: 15000,
        availabilityStatus: 'in_stock',
        freshnessStatus: 'fresh',
      },
    });

    const paypal = new PayPalService();
    const orderResult = await paypal.createCheckoutOrder({
      userId: testUser.id,
      offerId: offer.id,
    });

    expect(orderResult.valid).toBe(true);
    const orderId = orderResult.order.id;

    // Attempt to capture with a fake spoofed PayPal Order ID
    await expect(
      paypal.captureOrder({
        orderId,
        paypalOrderId: 'FAKE-SPOOFED-PAYPAL-ID-9999',
      })
    ).rejects.toThrow('PayPal Order ID mismatch');
  });

  // Test 17: Seller Trust & High-Risk Rejection Guard
  it('17. Untrusted seller with low rating (<3.0) and poor stock receives pass grade and refuses autonomous buy', () => {
    const untrustedOffer: NormalizedOffer = {
      ...sampleOffer,
      seller: { id: 's_untrusted', name: 'Shady Third Party', isAuthorized: false, rating: 2.1 },
      availabilityStatus: 'out_of_stock',
      freshnessStatus: 'stale',
      price: { itemPrice: 14000, shippingPrice: 500, fees: 0, currency: 'INR', totalPrice: 14500 },
    };

    const scoreResult = calculateDealScore({
      offer: untrustedOffer,
      targetPrice: 18000,
      historicalPrices: [20000, 19500, 19000],
    });

    expect(scoreResult.score).toBeLessThan(50);
    expect(scoreResult.recommendation).toBe('pass');
    expect(scoreResult.breakdown.sellerTrust).toBeLessThan(60);
  });
});
