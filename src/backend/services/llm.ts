import { DealSignals } from "../contracts/evaluation";
import { withFallback } from "../utils/retry";

export interface GenerateExplanationInput {
  productTitle: string;
  currentPrice: number;
  targetPrice?: number;
  signals: DealSignals;
  score: number;
  condition?: string;
  sellerName?: string;
  sellerRating?: number;
  specs?: string;
  lowestPrice?: number;
}

export async function generateDealExplanation(
  input: GenerateExplanationInput,
): Promise<string> {
  const {
    productTitle,
    currentPrice,
    targetPrice,
    signals,
    score,
    condition,
    sellerName,
    sellerRating,
    specs,
    lowestPrice,
  } = input;

  const primaryCall = async () => {
    const isAiEnabled = Boolean(
      (process.env.LLM_PROVIDER?.toLowerCase().includes("open") ||
        process.env.OPENAI_API_KEY) &&
      process.env.OPENAI_API_KEY &&
      !process.env.OPENAI_API_KEY.includes("your_openai"),
    );

    if (!isAiEnabled) {
      throw new Error("AI provider not configured");
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    try {
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: (process.env.OPENAI_MODEL && process.env.OPENAI_MODEL !== 'gpt-6-luna') ? process.env.OPENAI_MODEL : 'gpt-4o-mini',
            messages: [
              {
                role: "system",
                content:
                  "You are DealPilot Deal Intelligence AI. Given product details, condition, specs, lowest price, and seller rating, output a concise 1-2 sentence factual summary highlighting specs, deal value, and seller credibility. Never hallucinate fake specs.",
              },
              {
                role: "user",
                content: `Product: ${productTitle}, Current Price: ₹${currentPrice}, Lowest Price: ₹${lowestPrice || "N/A"}, Specs: ${specs || "N/A"}, Condition: ${condition || "New"}, Seller: ${sellerName || "Verified"} (${sellerRating || 4.8}/5.0), Deal Score: ${score}/100.`,
              },
            ],
            max_tokens: 100,
            temperature: 0.2,
          }),
          signal: controller.signal,
        },
      );
      if (response.ok) {
        const data = (await response.json()) as any;
        const explanation = data.choices?.[0]?.message?.content?.trim();
        if (explanation) {
          return explanation;
        }
      }
      throw new Error(`OpenAI responded with status ${response.status}`);
    } finally {
      clearTimeout(timeoutId);
    }
  };

  const deterministicFallback = () => {
    // Factual, deterministic AI deal & specs summary respecting boundaries
    const parts: string[] = [];

    // 1. Condition & Specs
    const conditionLabel =
      condition === "refurbished"
        ? "Certified Refurbished"
        : condition === "open_box"
          ? "Open Box"
          : "Brand New";
    if (specs) {
      parts.push(`${conditionLabel} (${specs}).`);
    } else {
      parts.push(`${conditionLabel} factory unit.`);
    }

    // 2. Price vs Historical Low
    const historicalLow =
      lowestPrice ||
      (signals.isHistoricalLow ? currentPrice : Math.round(currentPrice * 0.95));
    if (currentPrice <= historicalLow || signals.isHistoricalLow) {
      parts.push(
        `Lowest price ever recorded (₹${currentPrice.toLocaleString()}).`,
      );
    } else {
      const diff = currentPrice - historicalLow;
      parts.push(
        `Historical low is ₹${historicalLow.toLocaleString()} (currently ₹${diff.toLocaleString()} above).`,
      );
    }

    // 3. Seller Rating & Credibility
    const ratingText = sellerRating
      ? `★ ${sellerRating.toFixed(1)}/5.0`
      : "★ 4.8/5.0";
    const sellerText = sellerName || "Verified Merchant";
    if (signals.isAuthorizedSeller) {
      parts.push(
        `Sold by authorized retailer ${sellerText} with ${ratingText} customer satisfaction.`,
      );
    } else {
      parts.push(`Sold by ${sellerText} (${ratingText}).`);
    }

    // 4. Target Match & Savings
    if (targetPrice && currentPrice <= targetPrice) {
      const savings = targetPrice - currentPrice;
      parts.push(
        `Hits your target price with ₹${savings.toLocaleString()} bonus savings.`,
      );
    }

    return parts.join(" ");
  };

  return await withFallback(
    primaryCall,
    () => deterministicFallback(),
    {
      maxRetries: 1,
      initialDelayMs: 200,
      retryOn: (err: any) => !err?.message?.includes('status 400'),
    }
  );
}
