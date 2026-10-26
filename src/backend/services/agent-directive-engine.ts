import prisma from "@/backend/utils/db";
import { getCountryByCode } from "@/backend/contracts/countries";
import { processDiscoveryJob } from "@/backend/workers/discovery-worker";
export interface AgentDirectiveInput {
  userId: string;
  userEmail?: string;
  userPrompt: string;
  country?: string;
  currency?: string;
}

export interface AgentToolExecutionRecord {
  tool: string;
  input: any;
  resultSummary: string;
  timestamp: string;
}

export interface AgentDirectiveResult {
  success: boolean;
  message: string;
  toolsExecuted: AgentToolExecutionRecord[];
  thoughtProcess: string[];
  isTargetMet: boolean;
  source: string;
  rule: any;
  product: {
    id: string;
    title: string;
    brand: string;
    imageUrl: string | null;
    currentBestPrice: number;
    bestOffer: any;
  };
  merchantsCount: number;
  currency: string;
}

/**
 * Intelligent Tool-Enabled Autonomous Agent Directive Engine
 * Evaluates natural language buy directives by dynamically selecting and executing
 * specialized domain tools:
 * 1. parse_user_intent
 * 2. fetch_live_market_prices (routes to Channel3 for US/GB/EU/CA/AU, Buyhatke for IN)
 * 3. create_autonomous_tracking_rule
 * 4. evaluate_instant_buy_readiness
 */
export async function executeAgentBuyDirective(
  input: AgentDirectiveInput,
): Promise<AgentDirectiveResult> {
  const {
    userId,
    userEmail = "",
    userPrompt,
    country = "IN",
    currency = "INR",
  } = input;
  const countryConf = getCountryByCode(country);
  const isChannel3Market = Boolean(countryConf.channel3Country);

  const toolsExecuted: AgentToolExecutionRecord[] = [];
  const thoughtProcess: string[] = [];

  // =========================================================================
  // TOOL 1: parse_user_intent
  // =========================================================================
  const runParseIntentTool = () => {
    thoughtProcess.push(`Analyzing user directive: "${userPrompt}"`);

    // Price extraction: detects "at 18000", "under 45,000", "<= 20000", "below ₹30000", etc.
    let extractedTargetPrice: number | null = null;
    const priceMatch = userPrompt.match(
      /(?:under|below|drops to|reach(?:es)?|to|at|<=?)\s*(?:[₹$€£]|inr|usd|eur|gbp)?\s*([0-9]+(?:,[0-9]+)?)/i,
    );

    if (priceMatch && priceMatch[1]) {
      extractedTargetPrice = parseFloat(priceMatch[1].replace(/,/g, ""));
    }

    // Clean product query
    let cleanedQuery = userPrompt
      .replace(
        /(?:buy|purchase|order|pilot|watch|keep an eye on|monitor|alert me on)\s+/i,
        "",
      )
      .replace(
        /(?:when|if|once|under|below|drops to|reach(?:es)?|to|at|<=?)\s*(?:[₹$€£]|inr|usd|eur|gbp)?\s*[0-9]+(?:,[0-9]+)?.*/i,
        "",
      )
      .trim();

    if (!cleanedQuery || cleanedQuery.length < 2) {
      cleanedQuery = userPrompt.replace(/[0-9,₹$€£]/g, "").trim();
    }

    // Fallback benchmark target if none stated
    if (!extractedTargetPrice || extractedTargetPrice <= 0) {
      extractedTargetPrice = currency === "INR" ? 25000 : 300;
      thoughtProcess.push(
        `No explicit target price stated; defaulting target threshold to ${currency} ${extractedTargetPrice}`,
      );
    }

    toolsExecuted.push({
      tool: "parse_user_intent",
      input: { userPrompt },
      resultSummary: `Extracted product: "${cleanedQuery}", Target Price: ${currency} ${extractedTargetPrice}`,
      timestamp: new Date().toISOString(),
    });

    return {
      productQuery: cleanedQuery,
      targetPrice: extractedTargetPrice,
    };
  };

  const parsedIntent = runParseIntentTool();

  // =========================================================================
  // TOOL 2: fetch_live_market_prices (Channel3 vs Buyhatke domestic routing)
  // =========================================================================
  const runFetchPricesTool = async (
    productQuery: string,
    targetPrice: number,
  ) => {
    const sourceSystem = isChannel3Market ? "channel3" : "buyhatke";
    thoughtProcess.push(
      isChannel3Market
        ? `Country is ${countryConf.name} (${countryConf.code}): Routing live discovery to Channel3 Universal Commerce Network`
        : `Country is ${countryConf.name} (${countryConf.code}): Routing discovery to Buyhatke.com Domestic Price Intelligence (Amazon India, Flipkart, Croma, Tata CLiQ)`,
    );

    // Create SearchJob and invoke discovery worker synchronously
    const searchJob = await prisma.searchJob.create({
      data: {
        query: productQuery,
        targetPrice,
        status: "pending",
      },
    });

    const workerResult = await processDiscoveryJob({
      id: searchJob.id,
      data: {
        searchJobId: searchJob.id,
        query: productQuery,
        targetPrice,
        country: countryConf.code,
        currency,
      },
    } as any);

    // Locate matching product in catalog
    const product = await prisma.product.findFirst({
      where: workerResult?.productIds?.length
        ? { id: { in: workerResult.productIds } }
        : {
            OR: [
              { title: { contains: productQuery, mode: "insensitive" } },
              { brand: { contains: productQuery, mode: "insensitive" } },
            ],
          },
      include: {
        offers: {
          orderBy: { itemPrice: "asc" },
          include: {
            observations: {
              orderBy: { observedAt: "desc" },
              take: 5,
            },
          },
        },
      },
    });

    if (!product || product.offers.length === 0) {
      throw new Error(
        `No active retail offers discovered matching "${productQuery}" on ${sourceSystem === "channel3" ? "Channel3" : "Buyhatke"}`,
      );
    }

    // Currency normalization check

    toolsExecuted.push({
      tool: "fetch_live_market_prices",
      input: {
        query: productQuery,
        market: sourceSystem,
        country: countryConf.code,
      },
      resultSummary: `Discovered ${product.offers.length} merchant offers via ${sourceSystem.toUpperCase()}. Best price: ${currency} ${product.offers[0].itemPrice} from ${(product.offers[0] as any)?.sellerName || "Verified Store"}`,
      timestamp: new Date().toISOString(),
    });

    return {
      product,
      bestOffer: product.offers[0],
      sourceSystem,
    };
  };

  const marketData = await runFetchPricesTool(
    parsedIntent.productQuery,
    parsedIntent.targetPrice,
  );

  // =========================================================================
  // TOOL 3: create_autonomous_tracking_rule
  // =========================================================================
  const runCreateTrackingRuleTool = async (
    product: any,
    bestOffer: any,
    targetPrice: number,
  ) => {
    const currentPrice = bestOffer.itemPrice;
    const isTargetMet = currentPrice <= targetPrice;

    thoughtProcess.push(
      isTargetMet
        ? `Offer matched target price! Live price (${currency} ${currentPrice}) <= Target (${currency} ${targetPrice}). Preparing Buy Now action.`
        : `Target threshold not yet reached. Live price is ${currency} ${currentPrice} (Target: ${currency} ${targetPrice}). Registering active background watcher with adaptive polling.`,
    );

    const existingRule = await prisma.trackingRule.findFirst({
      where: {
        userId,
        productId: product.id,
        status: "active",
      },
    });

    const rule = existingRule
      ? await prisma.trackingRule.update({
          where: { id: existingRule.id },
          data: {
            targetPrice,
            currency,
            pollingPolicy: isTargetMet ? "near_target" : "normal",
            nextCheckAt: new Date(Date.now() + 3000),
          },
        })
      : await prisma.trackingRule.create({
          data: {
            userId,
            productId: product.id,
            offerId: product.offers[0]?.id,
            targetPrice,
            currency,
            strategy: "target_price",
            status: "active",
            pollingPolicy: isTargetMet ? "near_target" : "normal",
            nextCheckAt: new Date(Date.now() + 3000),
          },
        });

    toolsExecuted.push({
      tool: "create_autonomous_tracking_rule",
      input: { productId: product.id, targetPrice, currency },
      resultSummary: `Registered TrackingRule ${rule.id} (Polling: ${rule.pollingPolicy})`,
      timestamp: new Date().toISOString(),
    });

    return { rule, isTargetMet };
  };

  const { rule, isTargetMet } = await runCreateTrackingRuleTool(
    marketData.product,
    marketData.bestOffer,
    parsedIntent.targetPrice,
  );

  // =========================================================================
  // TOOL 4: evaluate_instant_buy_readiness
  // =========================================================================
  if (isTargetMet && marketData.product.offers[0]) {
    const rawOffer = marketData.product.offers[0];
    const deduplicationKey = `agent_directive_matched_${rule.id}_${rawOffer.id}_${Math.round(marketData.bestOffer.itemPrice)}`;

    await prisma.notificationOutbox.upsert({
      where: { deduplicationKey },
      create: {
        trackingRuleId: rule.id,
        offerId: rawOffer.id,
        eventType: "target_hit",
        status: "pending",
        deduplicationKey,
        payload: JSON.stringify({
          userEmail,
          productTitle: marketData.product.title,
          targetPrice: parsedIntent.targetPrice,
          currentPrice: marketData.bestOffer.itemPrice,
          currency,
          merchant: rawOffer.sellerName,
          source: marketData.sourceSystem,
          savings: parsedIntent.targetPrice - marketData.bestOffer.itemPrice,
          triggeredAt: new Date().toISOString(),
        }),
      },
      update: {},
    });

    toolsExecuted.push({
      tool: "evaluate_instant_buy_readiness",
      input: {
        currentPrice: marketData.bestOffer.itemPrice,
        targetPrice: parsedIntent.targetPrice,
      },
      resultSummary: `Generated NotificationOutbox event for Buy Now one-click authorization.`,
      timestamp: new Date().toISOString(),
    });
  }

  const userFacingMessage = isTargetMet
    ? `Target matched! Live price on ${marketData.sourceSystem === "channel3" ? "Channel3" : "Buyhatke"} is ${currency} ${marketData.bestOffer.itemPrice.toLocaleString()} (Target: ${currency} ${parsedIntent.targetPrice.toLocaleString()}). Ready to Buy Now.`
    : `Agent monitoring activated on ${marketData.sourceSystem === "channel3" ? "Channel3 Network" : "Buyhatke Price Radar"}. Watching live prices across merchants and will notify you when it drops to ${currency} ${parsedIntent.targetPrice.toLocaleString()}.`;

  return {
    success: true,
    message: userFacingMessage,
    toolsExecuted,
    thoughtProcess,
    isTargetMet,
    source: marketData.sourceSystem as "channel3" | "buyhatke",
    rule,
    product: {
      id: marketData.product.id,
      title: marketData.product.title,
      brand: marketData.product.brand,
      imageUrl: marketData.product.imageUrl,
      currentBestPrice: marketData.bestOffer.itemPrice,
      bestOffer: {
        ...marketData.product.offers[0],
        ...marketData.bestOffer,
      },
    },
    merchantsCount: marketData.product.offers.length,
    currency,
  };
}
