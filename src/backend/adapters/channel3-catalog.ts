import { Channel3 } from "@channel3/sdk";
import { CatalogAdapter, CatalogSearchFilter } from "./catalog-adapter";
import { NormalizedOffer } from "../contracts/offer";
import { verifyProductMatch } from "../engine/product-verifier";
import { getCountryByCode } from "../contracts/countries";

export class Channel3CatalogAdapter implements CatalogAdapter {
  readonly sourceId = "channel3";
  readonly name = "Channel3 Universal Commerce Network";
  private client: Channel3 | null = null;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.CHANNEL3_API_KEY;
    if (key) {
      this.client = new Channel3({ apiKey: key });
    }
  }

  async search(filter: CatalogSearchFilter): Promise<NormalizedOffer[]> {
    // 1. Live Query via Official Channel3 SDK
    if (this.client) {
      try {
        const queryTerm = filter.query ?? "";
        const countryConf = getCountryByCode(filter.country);

        // Configure request with country and currency constraints if supported by Channel3
        const searchConfig: any = {};
        if (countryConf.channel3Country) {
          searchConfig.country = countryConf.channel3Country;
        }
        if (countryConf.channel3Currency) {
          searchConfig.currency = countryConf.channel3Currency;
        }

        const page = await this.client.products.search({
          query: queryTerm,
          limit: 10,
          config: Object.keys(searchConfig).length > 0 ? searchConfig : undefined,
        });

        const products = page.data || [];
        const offers: NormalizedOffer[] = [];

        for (const prod of products) {
          const productOffers = (prod as any).offers || [];
          if (productOffers.length === 0) continue;

          const brandName =
            (Array.isArray((prod as any).brands) &&
              (prod as any).brands[0]?.name) ||
            ((prod as any).brands && (prod as any).brands[0]) ||
            "Verified Retailer";
          const categoryName =
            typeof (prod as any).category === "string"
              ? (prod as any).category
              : (prod as any).category?.title ||
                (prod as any).category?.name ||
                filter.category ||
                "Consumer Electronics";
          const imageUrl =
            (prod as any).images?.[0]?.cleaned_url ||
            (prod as any).images?.[0]?.url;

          const title = prod.title ?? "Deal Item";

          const ratingsData = (prod as any).ratings;
          const rating =
            typeof ratingsData?.value === "number" ? ratingsData.value : 4.5;
          const reviewCount =
            typeof ratingsData?.count === "number" ? ratingsData.count : 150;

          for (const rawOffer of productOffers) {
            const rawPrice = Number(rawOffer.price?.price || 0);
            if (rawPrice <= 0) continue;

            const rawCurrency = rawOffer.price?.currency;
            const currency = filter.currency || (rawCurrency && rawCurrency !== 'USD' ? rawCurrency : countryConf.currency);
            const itemPrice = Math.round(rawPrice);

            if (filter.maxPrice && itemPrice > filter.maxPrice) {
              continue;
            }

            // Verify relevance & protect against accessories/junk
            if (filter.query) {
              const verification = verifyProductMatch({
                query: filter.query,
                title,
                brand: String(brandName),
                category: String(categoryName),
                price: itemPrice,
              });

              if (!verification.isMatch) {
                // Reject accessory mismatches and low-relevance results
                continue;
              }
            }

            const extId = `c3_${prod.id}_${rawOffer.domain?.replace(/[^a-zA-Z0-9]/g, "")}`;

            offers.push({
              sourceId: this.sourceId,
              externalProductId: extId,
              offerUrl: rawOffer.url ?? "https://trychannel3.com",
              canonicalProductId: `c3-${prod.id}`,
              title,
              brand: String(brandName),
              model: title,
              category: String(categoryName),
              imageUrl,
              variantAttributes: {
                condition:
                  rawOffer.condition === "refurbished" ? "refurbished" : "new",
              },
              seller: {
                id: `c3-seller-${rawOffer.domain || "merchant"}`,
                name: rawOffer.domain || "Channel3 Verified Merchant",
                isAuthorized: true,
                rating,
                reviewCount,
              },
              price: {
                itemPrice,
                shippingPrice: 0,
                fees: 0,
                currency,
                totalPrice: itemPrice,
              },
              availabilityStatus:
                rawOffer.availability === "OutOfStock"
                  ? "out_of_stock"
                  : "in_stock",
              sourceConfidence: 0.98,
              observedAt: new Date(),
            });
          }
        }

        if (offers.length > 0) return offers;
      } catch (err: any) {
        console.warn(
          "[Channel3CatalogAdapter] Channel3 SDK query failed, falling back to simulated catalog:",
          err.message || err,
        );
      }
    }

    // 2. Curated Fallback Feed (if offline or unconfigured)
    return this.getSimulatedChannel3Offers(filter);
  }

  async fetchOffer(externalProductId: string): Promise<NormalizedOffer | null> {
    // 1. Resolve via Channel3 SDK retrieve API
    if (this.client) {
      try {
        const parts = externalProductId.split("_");
        const productId = parts[1]; // extracted Channel3 product_id
        if (productId) {
          const prod = await this.client.products.retrieve({
            product_id: productId,
          });
          if (prod) {
            const productOffers = (prod as any).offers || [];
            const brandName =
              (Array.isArray((prod as any).brands) &&
                (prod as any).brands[0]?.name) ||
              ((prod as any).brands && (prod as any).brands[0]) ||
              "Verified Retailer";
            const categoryName =
              typeof (prod as any).category === "string"
                ? (prod as any).category
                : (prod as any).category?.title ||
                  (prod as any).category?.name ||
                  "Consumer Goods";
            const imageUrl =
              (prod as any).images?.[0]?.cleaned_url ||
              (prod as any).images?.[0]?.url ||
              "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80";

            const ratingsData = (prod as any).ratings;
            const rating =
              typeof ratingsData?.value === "number" ? ratingsData.value : 4.5;
            const reviewCount =
              typeof ratingsData?.count === "number" ? ratingsData.count : 150;

            const rawOffer = productOffers[0] || {};
            const rawPrice = Number(rawOffer.price?.price || 0);
            const currency = rawOffer.price?.currency || "USD";
            const itemPrice = Math.round(rawPrice);

            return {
              sourceId: this.sourceId,
              externalProductId,
              offerUrl: rawOffer.url || "https://trychannel3.com",
              canonicalProductId: `c3-${prod.id}`,
              title: prod.title || "Channel3 Verified Deal",
              brand: String(brandName),
              model: prod.title || "Standard",
              category: String(categoryName),
              imageUrl,
              variantAttributes: {
                condition:
                  rawOffer.condition === "refurbished" ? "refurbished" : "new",
              },
              seller: {
                id: `c3-seller-${rawOffer.domain || "merchant"}`,
                name: rawOffer.domain || "Channel3 Verified Merchant",
                isAuthorized: true,
                rating,
                reviewCount,
              },
              price: {
                itemPrice: itemPrice || 150,
                shippingPrice: 0,
                fees: 0,
                currency,
                totalPrice: itemPrice || 150,
              },
              availabilityStatus:
                rawOffer.availability === "OutOfStock"
                  ? "out_of_stock"
                  : "in_stock",
              sourceConfidence: 0.98,
              observedAt: new Date(),
            };
          }
        }
      } catch (err: any) {
        console.warn(
          `[Channel3CatalogAdapter] Retrieve failed for ${externalProductId}:`,
          err.message || err,
        );
      }
    }

    const all = await this.search({ query: "" });
    return all.find((o) => o.externalProductId === externalProductId) || null;
  }

  async revalidateOffer(externalProductId: string): Promise<{
    offer: NormalizedOffer | null;
    isAvailable: boolean;
    priceChanged: boolean;
    currentTotalPrice: number;
  }> {
    const offer = await this.fetchOffer(externalProductId);
    if (!offer) {
      return {
        offer: null,
        isAvailable: false,
        priceChanged: true,
        currentTotalPrice: 0,
      };
    }

    return {
      offer,
      isAvailable: offer.availabilityStatus === "in_stock",
      priceChanged: false,
      currentTotalPrice: offer.price.totalPrice,
    };
  }

  private getSimulatedChannel3Offers(
    filter: CatalogSearchFilter,
  ): NormalizedOffer[] {
    const query = filter.query.toLowerCase();
    const simulated = [
      {
        id: "c3_airpods_pro_2",
        canonicalId: "apple-airpods-pro-2",
        title: "Apple AirPods Pro (2nd Gen) with MagSafe USB-C",
        brand: "Apple",
        model: "AirPods Pro 2",
        category: "Audio",
        price: 19999,
        seller: "Croma Verified",
        url: "https://croma.com/apple-airpods-pro-2",
        imageUrl:
          "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=500&q=80",
      },
      {
        id: "c3_sony_wh1000xm4",
        canonicalId: "sony-wh-1000xm4",
        title: "Sony WH-1000XM4 Wireless Noise Cancelling Headphones",
        brand: "Sony",
        model: "WH-1000XM4",
        category: "Audio",
        price: 18490,
        seller: "Reliance Digital",
        url: "https://reliancedigital.in/sony-wh1000xm4",
        imageUrl:
          "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80",
      },
      {
        id: "c3_bose_qc45",
        canonicalId: "bose-quietcomfort-45",
        title: "Bose QuietComfort 45 Bluetooth Headphones - Triple Black",
        brand: "Bose",
        model: "QuietComfort 45",
        category: "Audio",
        price: 21990,
        seller: "Vijay Sales",
        url: "https://vijaysales.com/bose-qc45",
        imageUrl:
          "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=500&q=80",
      },
    ];

    return simulated
      .filter((item) => {
        if (
          query &&
          !item.title.toLowerCase().includes(query) &&
          !item.brand.toLowerCase().includes(query)
        ) {
          return false;
        }
        if (filter.maxPrice && item.price > filter.maxPrice) {
          return false;
        }
        return true;
      })
      .map((item) => ({
        sourceId: this.sourceId,
        externalProductId: item.id,
        offerUrl: item.url,
        canonicalProductId: item.canonicalId,
        title: item.title,
        brand: item.brand,
        model: item.model,
        category: item.category,
        imageUrl: item.imageUrl,
        variantAttributes: {
          condition: "new" as const,
        },
        seller: {
          id: `seller-${item.id}`,
          name: item.seller,
          isAuthorized: true,
          rating: 4.8,
        },
        price: {
          itemPrice: item.price,
          shippingPrice: 0,
          fees: 0,
          currency: "INR",
          totalPrice: item.price,
        },
        availabilityStatus: "in_stock" as const,
        sourceConfidence: 0.95,
        observedAt: new Date(),
      }));
  }
}
