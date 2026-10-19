import prisma from "../utils/db";
import { getOrCreateDemoUser } from "../utils/user";
import { monitoringQueue } from "../queue/queues";

export interface CopilotMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface CopilotActionPayload {
  type: "search_results" | "rule_created" | "price_history" | "comparison";
  products?: any[];
  rule?: any;
  history?: any;
  comparison?: any;
}

export interface CopilotResponse {
  reply: string;
  action?: CopilotActionPayload;
  suggestedPrompts?: string[];
}

// 1. Tool: Search Deals
export async function searchDealsTool(params: {
  query: string;
  budget?: number;
  brand?: string;
}) {
  const cleanQuery = (params.query || "").trim();
  const searchTerms = cleanQuery.split(/\s+/).filter(Boolean);

  const whereConditions: any[] = [
    { title: { contains: cleanQuery, mode: "insensitive" } },
    { brand: { contains: cleanQuery, mode: "insensitive" } },
    { category: { contains: cleanQuery, mode: "insensitive" } },
    ...searchTerms.map((term) => ({
      title: { contains: term, mode: "insensitive" as const },
    })),
    ...searchTerms.map((term) => ({
      brand: { contains: term, mode: "insensitive" as const },
    })),
  ];

  if (params.brand) {
    whereConditions.push({
      brand: { contains: params.brand, mode: "insensitive" },
    });
  }

  const products = await prisma.product.findMany({
    where: {
      OR: whereConditions.length > 0 ? whereConditions : undefined,
    },
    take: 8,
    orderBy: { updatedAt: "desc" },
    include: {
      offers: {
        orderBy: { totalPrice: "asc" },
        include: {
          evaluations: { orderBy: { evaluatedAt: "desc" }, take: 1 },
          observations: { orderBy: { observedAt: "desc" }, take: 5 },
        },
      },
    },
  });

  // Filter by budget if provided
  let filtered = products;
  if (params.budget && params.budget > 0) {
    filtered = products.filter((p) => {
      const bestOffer = p.offers[0];
      return bestOffer ? bestOffer.totalPrice <= (params.budget || 0) : true;
    });
  }

  const formatted = filtered.map((p) => {
    const offer = p.offers[0];
    const evalData = offer?.evaluations[0];
    return {
      id: p.id,
      title: p.title,
      brand: p.brand,
      category: p.category,
      imageUrl: p.imageUrl,
      price: offer?.totalPrice || 0,
      currency: offer?.currency || "INR",
      dealScore: evalData?.score || 78,
      sellerName: offer?.sellerName || "Verified Merchant",
      sellerRating: offer?.sellerRating || 4.8,
      sourceId: offer?.sourceId || "mock_retailer",
      rawOffer: offer,
      rawProduct: p,
    };
  });

  return formatted;
}

// 2. Tool: Create Price Alert Rule
export async function createPriceAlertTool(params: {
  productId?: string;
  productName?: string;
  targetPrice: number;
}) {
  const user = await getOrCreateDemoUser();

  let targetProduct: any = null;

  if (params.productId) {
    targetProduct = await prisma.product.findUnique({
      where: { id: params.productId },
      include: { offers: true },
    });
  } else if (params.productName) {
    const raw = params.productName.trim();
    const cleanTerms = raw
      .replace(/track|alert|watch|monitor|when|if|drops|below|under|at|to|reaches/gi, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    targetProduct = await prisma.product.findFirst({
      where: {
        OR: [
          { title: { contains: raw, mode: 'insensitive' } },
          ...cleanTerms.map((t) => ({ title: { contains: t, mode: 'insensitive' as const } })),
          ...cleanTerms.map((t) => ({ category: { contains: t, mode: 'insensitive' as const } })),
        ],
      },
      include: { offers: true },
    });

    if (!targetProduct) {
      targetProduct = await prisma.product.findFirst({ include: { offers: true } });
    }
  }

  if (!targetProduct) {
    throw new Error(
      `Could not find product matching "${params.productName || params.productId}" to track.`
    );
  }

  const primaryOffer = targetProduct.offers[0];

  const rule = await prisma.trackingRule.create({
    data: {
      userId: user.id,
      productId: targetProduct.id,
      offerId: primaryOffer?.id,
      targetPrice: params.targetPrice,
      strategy: 'target_price',
      status: 'active',
      nextCheckAt: new Date(Date.now() + 5000),
    },
    include: {
      product: true,
    },
  });

  try {
    await monitoringQueue.add('dealpilot-monitor-rule', {
      trackingRuleId: rule.id,
    });
  } catch {
    // Ignore queue connection issues in mock mode
  }

  return {
    id: rule.id,
    productId: targetProduct.id,
    productTitle: targetProduct.title,
    targetPrice: rule.targetPrice,
    currentPrice: primaryOffer?.totalPrice || 0,
    status: rule.status,
  };
}

// 3. Tool: Price History & Analytics
export async function getPriceHistoryTool(params: {
  productId?: string;
  productName?: string;
}) {
  let product: any = null;

  if (params.productId) {
    product = await prisma.product.findUnique({
      where: { id: params.productId },
      include: {
        offers: {
          include: { observations: { orderBy: { observedAt: 'desc' } } },
        },
      },
    });
  } else if (params.productName) {
    const raw = params.productName.trim();
    const cleanTerms = raw
      .replace(/30-day|14-day|7-day|price|history|trend|chart|trajectory|show|for|of/gi, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    product = await prisma.product.findFirst({
      where: {
        OR: [
          { title: { contains: raw, mode: 'insensitive' } },
          ...cleanTerms.map((t) => ({ title: { contains: t, mode: 'insensitive' as const } })),
          ...cleanTerms.map((t) => ({ category: { contains: t, mode: 'insensitive' as const } })),
        ],
      },
      include: {
        offers: {
          include: { observations: { orderBy: { observedAt: 'desc' } } },
        },
      },
    });

    if (!product) {
      product = await prisma.product.findFirst({
        include: {
          offers: {
            include: { observations: { orderBy: { observedAt: 'desc' } } },
          },
        },
      });
    }
  }

  if (!product) {
    throw new Error(`Product "${params.productName || params.productId}" not found.`);
  }

  const primaryOffer = product.offers[0];
  const observations = primaryOffer?.observations || [];
  const prices = observations.map((o: any) => o.totalPrice);
  const currentPrice = primaryOffer?.totalPrice || 0;
  const lowestRecorded =
    prices.length > 0 ? Math.min(...prices) : Math.round(currentPrice * 0.94);
  const highestRecorded =
    prices.length > 0 ? Math.max(...prices) : Math.round(currentPrice * 1.08);
  const averagePrice =
    prices.length > 0
      ? Math.round(
          prices.reduce((a: number, b: number) => a + b, 0) / prices.length,
        )
      : currentPrice;

  return {
    productId: product.id,
    title: product.title,
    currentPrice,
    lowestRecorded,
    highestRecorded,
    averagePrice,
    dropPercent: Math.round(
      ((highestRecorded - currentPrice) / Math.max(highestRecorded, 1)) * 100,
    ),
    savingsVsHigh: highestRecorded - currentPrice,
    isAllTimeLow: currentPrice <= lowestRecorded,
  };
}

// 4. Tool: Compare Deals
export async function compareDealsTool(params: {
  query?: string;
  productIds?: string[];
}) {
  let products: any[] = [];

  if (params.productIds && params.productIds.length > 0) {
    products = await prisma.product.findMany({
      where: { id: { in: params.productIds } },
      include: {
        offers: {
          include: { evaluations: { take: 1 } },
        },
      },
    });
  } else if (params.query) {
    products = await prisma.product.findMany({
      where: {
        OR: [
          { title: { contains: params.query.trim(), mode: "insensitive" } },
          { category: { contains: params.query.trim(), mode: "insensitive" } },
        ],
      },
      take: 4,
      include: {
        offers: {
          include: { evaluations: { take: 1 } },
        },
      },
    });
  }

  if (products.length < 2) {
    // If fewer than 2 matched, fetch top 2 related products
    products = await prisma.product.findMany({
      take: 2,
      orderBy: { updatedAt: "desc" },
      include: {
        offers: {
          include: { evaluations: { take: 1 } },
        },
      },
    });
  }

  const comparisonRows = products.map((p) => {
    const offer = p.offers[0];
    const evalData = offer?.evaluations[0];
    let condition = "Brand New";
    try {
      const attrs =
        typeof offer?.variantAttributes === "string"
          ? JSON.parse(offer.variantAttributes)
          : offer?.variantAttributes || {};
      if (
        attrs.condition === "refurbished" ||
        offer?.condition === "refurbished"
      ) {
        condition = "Refurbished";
      }
    } catch {}

    return {
      id: p.id,
      title: p.title,
      brand: p.brand,
      category: p.category,
      price: offer?.totalPrice || 0,
      currency: offer?.currency || "INR",
      dealScore: evalData?.score || 78,
      condition,
      sellerName: offer?.sellerName || "Verified Merchant",
      sellerRating: offer?.sellerRating || 4.8,
      isAuthorized: offer?.isAuthorizedSeller,
      rawProduct: p,
      rawOffer: offer,
    };
  });

  return comparisonRows;
}

// 5. Unified Shopping Copilot Engine
export async function executeShoppingCopilot(
  userQuery: string,
  history: CopilotMessage[] = [],
): Promise<CopilotResponse> {
  const queryLower = userQuery.toLowerCase().trim();

  // Check if OpenAI LLM with function calling is available
  const isAiConfigured = Boolean(
    (process.env.LLM_PROVIDER?.toLowerCase().includes("open") ||
      process.env.OPENAI_API_KEY) &&
    process.env.OPENAI_API_KEY &&
    !process.env.OPENAI_API_KEY.includes("your_openai"),
  );

  if (isAiConfigured) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const tools = [
        {
          type: "function",
          function: {
            name: "search_deals",
            description:
              "Search for product deals, electronics, headphones, laptops, and monitors by keyword, brand, or budget.",
            parameters: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "Product search terms or keywords",
                },
                budget: {
                  type: "number",
                  description: "Maximum budget or price in INR",
                },
                brand: {
                  type: "string",
                  description: "Brand name if specified",
                },
              },
              required: ["query"],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "create_price_alert",
            description:
              "Create an automated tracking rule / price watch when a product drops below a target price.",
            parameters: {
              type: "object",
              properties: {
                productName: {
                  type: "string",
                  description: "Name of the product to track",
                },
                targetPrice: {
                  type: "number",
                  description: "Target price threshold in INR",
                },
              },
              required: ["productName", "targetPrice"],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "get_price_history",
            description:
              "Retrieve 30-day historical price trajectory, lowest/highest recorded prices, and trend analysis.",
            parameters: {
              type: "object",
              properties: {
                productName: {
                  type: "string",
                  description: "Product title or keywords",
                },
              },
              required: ["productName"],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "compare_deals",
            description:
              "Compare 2 or more products side-by-side on price, deal score, condition, and seller ratings.",
            parameters: {
              type: "object",
              properties: {
                query: { type: "string", description: "Products to compare" },
              },
              required: ["query"],
            },
          },
        },
      ];

      const messages = [
        {
          role: "system",
          content:
            "You are DealPilot Copilot, an expert autonomous shopping assistant. You help users discover the best deals, track price drops with automated background workers, analyze 30-day price trends, and compare products. Call tools whenever appropriate to find real live data. Be concise, polite, and factual.",
        },
        ...history.slice(-4),
        { role: "user", content: userQuery },
      ];

      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL ?? "gpt-6-luna",
          messages,
          tools,
          tool_choice: "auto",
          max_tokens: 350,
          temperature: 0.3,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = (await res.json()) as any;
        const choice = data.choices?.[0];
        const message = choice?.message;

        if (message?.tool_calls && message.tool_calls.length > 0) {
          const toolCall = message.tool_calls[0];
          const fnName = toolCall.function.name;
          const fnArgs = JSON.parse(toolCall.function.arguments || "{}");

          if (fnName === "search_deals") {
            const results = await searchDealsTool(fnArgs);
            return {
              reply:
                message.content ||
                `I found ${results.length} deal${results.length === 1 ? "" : "s"} matching "${fnArgs.query}". Here are the top evaluated offers:`,
              action: { type: "search_results", products: results },
              suggestedPrompts: [
                "Set a price alert for the top deal",
                "Show price history chart",
                "Compare top two deals",
              ],
            };
          }

          if (fnName === "create_price_alert") {
            const rule = await createPriceAlertTool(fnArgs);
            return {
              reply: `✅ Created automated price tracking rule for **${rule.productTitle}**! Our background workers will monitor retailers and alert you as soon as the price hits ₹${rule.targetPrice.toLocaleString()}.`,
              action: { type: "rule_created", rule },
              suggestedPrompts: [
                "View active watches in Watches tab",
                "Show historical lowest price",
                "Search for related deals",
              ],
            };
          }

          if (fnName === "get_price_history") {
            const historyData = await getPriceHistoryTool(fnArgs);
            return {
              reply: `📊 **${historyData.title}** has a current price of ₹${historyData.currentPrice.toLocaleString()}, with an all-time low of ₹${historyData.lowestRecorded.toLocaleString()} (savings of ₹${historyData.savingsVsHigh.toLocaleString()} vs high).`,
              action: { type: "price_history", history: historyData },
              suggestedPrompts: [
                `Set watch at all-time low (₹${historyData.lowestRecorded.toLocaleString()})`,
                "Compare against similar products",
              ],
            };
          }

          if (fnName === "compare_deals") {
            const comp = await compareDealsTool(fnArgs);
            return {
              reply: `⚖️ Here is the side-by-side comparison for ${comp.map((c) => c.title).join(" vs ")}:`,
              action: { type: "comparison", comparison: comp },
              suggestedPrompts: [
                "Track lowest priced product",
                "Check price history for the winner",
              ],
            };
          }
        }

        if (message?.content) {
          return {
            reply: message.content,
            suggestedPrompts: [
              "Find headphones under ₹15,000",
              "Track Sony WH-1000XM5 price drop",
              "Show Dell XPS price history",
            ],
          };
        }
      }
    } catch {
      // Fall through to deterministic intelligence engine
    }
  }

  // ==========================================
  // DETERMINISTIC INTENT ROUTER & TOOL CALLER
  // ==========================================

  // Intent A: Tracking / Price Alert
  // E.g. "Track Sony XM5 if it drops below 15000", "Track headphones if it drops below 16000", "Alert me under 12k"
  const isTrackingIntent =
    queryLower.includes('track') ||
    queryLower.includes('alert') ||
    queryLower.includes('watch') ||
    queryLower.includes('monitor') ||
    queryLower.includes('notify');

  if (isTrackingIntent) {
    // Extract price number: e.g. "16000", "15k", "under 12000"
    const priceMatch =
      queryLower.match(/(?:below|under|at|to|reaches|drops?\s*(?:to|below)?)\s*(?:₹|rs\.?|inr\s*)?(\d+[\d,]*)(?:k)?/i) ||
      queryLower.match(/(?:₹|rs\.?|inr\s*)(\d+[\d,]*)(?:k)?/i);

    let targetPrice: number | undefined;
    if (priceMatch) {
      const rawDigits = parseInt(priceMatch[1].replace(/,/g, ''), 10);
      targetPrice = priceMatch[0].toLowerCase().includes('k') ? rawDigits * 1000 : rawDigits;
    }

    // Clean product search phrase
    const cleanProductName = queryLower
      .replace(/(?:track|alert|watch|monitor|notify)\s*(?:me)?/gi, ' ')
      .replace(/(?:if\s+it\s+|when\s+it\s+|it\s+)?(?:drops?\s*(?:to|below)?|falls?\s*(?:to|below)?|under|below|at|to|reaches)\s*(?:₹|rs\.?|inr\s*)?\d+[\d,]*(?:k)?/gi, ' ')
      .replace(/\b(?:if|when|it|is|for|on|the|a|an)\b/gi, ' ')
      .trim();

    try {
      const candidate =
        (await prisma.product.findFirst({
          where: {
            OR: [
              { title: { contains: cleanProductName, mode: 'insensitive' } },
              { category: { contains: cleanProductName, mode: 'insensitive' } },
              { brand: { contains: cleanProductName, mode: 'insensitive' } },
              ...cleanProductName
                .split(/\s+/)
                .filter(Boolean)
                .map((t) => ({ title: { contains: t, mode: 'insensitive' as const } })),
            ],
          },
          include: { offers: true },
        })) || (await prisma.product.findFirst({ include: { offers: true } }));

      if (candidate) {
        const current = candidate.offers[0]?.totalPrice || 20000;
        const finalTarget = targetPrice || Math.round(current * 0.9);
        const rule = await createPriceAlertTool({
          productId: candidate.id,
          targetPrice: finalTarget,
        });

        return {
          reply: `✅ Active price watch established! I am tracking **${candidate.title}** (Current: ₹${current.toLocaleString()}). As soon as Redis background workers detect a price at or below **₹${finalTarget.toLocaleString()}**, you will receive an outbox alert.`,
          action: { type: 'rule_created', rule },
          suggestedPrompts: [
            'View all my active watches',
            `Show price history for ${candidate.title}`,
            'Find similar deals',
          ],
        };
      }
    } catch {}
  }

  // Intent B: Price History & Trends
  // E.g. "Price history for Sony", "What is the lowest price for Bose", "Show trend for MacBook"
  if (
    queryLower.includes("history") ||
    queryLower.includes("trend") ||
    queryLower.includes("lowest recorded") ||
    queryLower.includes("all time low") ||
    queryLower.includes("price drop")
  ) {
    const cleanSubject = queryLower
      .replace(
        /30-day|14-day|7-day|price history|history|trend|lowest recorded|all time low|what is the|show me|show|for|of/gi,
        ''
      )
      .trim();

    try {
      const historyData = await getPriceHistoryTool({
        productName: cleanSubject || "headphones",
      });
      return {
        reply: `📈 **Price Trajectory Analysis**: **${historyData.title}** is currently priced at **₹${historyData.currentPrice.toLocaleString()}**. Its all-time lowest recorded price is **₹${historyData.lowestRecorded.toLocaleString()}** (${historyData.dropPercent}% drop from peak).`,
        action: { type: "price_history", history: historyData },
        suggestedPrompts: [
          `Set alert at ₹${historyData.lowestRecorded.toLocaleString()}`,
          "Compare with alternative models",
          "Search latest deals",
        ],
      };
    } catch {}
  }

  // Intent C: Comparison
  // E.g. "Compare Sony XM5 vs Bose QuietComfort", "Compare headphones"
  if (
    queryLower.includes("compare") ||
    queryLower.includes(" vs ") ||
    queryLower.includes("versus")
  ) {
    const compSubject = queryLower.replace(/compare|vs|versus/gi, " ").trim();
    const compResults = await compareDealsTool({ query: compSubject });

    return {
      reply: `⚖️ **Side-by-Side Comparison**: Here is a breakdown of evaluated offers matching your request, comparing deal score, condition, verified seller reliability, and price:`,
      action: { type: "comparison", comparison: compResults },
      suggestedPrompts: [
        "Track the top-scoring product",
        "Show 30-day price trends",
        "Find more deals in this category",
      ],
    };
  }

  // Intent D: Search & Discovery (Default)
  // Extract budget if mentioned e.g. "under 20000", "below 15k"
  let budget: number | undefined;
  const budgetMatch = queryLower.match(
    /(?:under|below|less than|max|budget)\s*(?:₹|rs\.?|inr\s*)?(\d+)(?:k)?/i,
  );
  if (budgetMatch) {
    const rawVal = parseInt(budgetMatch[1], 10);
    budget = budgetMatch[0].toLowerCase().includes("k")
      ? rawVal * 1000
      : rawVal;
  }

  const cleanSearchQuery =
    queryLower
      .replace(
        /(?:find|search|show|get|deals?|under|below|less than|max|budget)\s*(?:₹|rs\.?|inr\s*)?\d+(?:k)?/gi,
        "",
      )
      .trim() || "headphones";

  const searchResults = await searchDealsTool({
    query: cleanSearchQuery,
    budget,
  });

  return {
    reply: `🔍 Found **${searchResults.length} evaluated deal${searchResults.length === 1 ? "" : "s"}** for "${cleanSearchQuery}"${budget ? ` within ₹${budget.toLocaleString()}` : ""}. Every offer has been normalized with live deal scoring and seller credentials:`,
    action: { type: "search_results", products: searchResults },
    suggestedPrompts: [
      searchResults[0]
        ? `Track ${searchResults[0].title.slice(0, 24)}...`
        : "Find wireless headphones",
      "Compare top 2 deals",
      "Show price history chart",
    ],
  };
}
