import { CatalogAdapter, CatalogSearchFilter } from "./catalog-adapter";
import { NormalizedOffer } from "../contracts/offer";

export interface MockProductSeed {
  externalProductId: string;
  canonicalProductId: string;
  title: string;
  brand: string;
  model: string;
  category: string;
  imageUrl: string;
  variantAttributes: {
    color: string;
    condition: "new" | "refurbished" | "open_box";
    storage?: string;
  };
  seller: {
    id: string;
    name: string;
    isAuthorized: boolean;
    rating: number;
    reviewCount: number;
  };
  price: {
    itemPrice: number;
    shippingPrice: number;
    fees: number;
    currency: string;
    totalPrice: number;
  };
  availabilityStatus: "in_stock" | "out_of_stock" | "preorder";
}

export class MockCatalogAdapter implements CatalogAdapter {
  sourceId = "mock_retailer";
  name = "DealPilot Mock Catalog Adapter";
  private inventory: Map<string, MockProductSeed>;

  constructor(customSeeds: MockProductSeed[] = []) {
    this.inventory = new Map();
    for (const seed of customSeeds) {
      this.inventory.set(seed.externalProductId, { ...seed });
    }
  }

  setSeed(seed: MockProductSeed) {
    this.inventory.set(seed.externalProductId, { ...seed });
  }

  clear() {
    this.inventory.clear();
  }

  async search(filter: CatalogSearchFilter): Promise<NormalizedOffer[]> {
    const query = filter.query.toLowerCase().trim();
    const results: NormalizedOffer[] = [];

    for (const item of this.inventory.values()) {
      const matchesQuery =
        !query ||
        item.title.toLowerCase().includes(query) ||
        item.brand.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.model.toLowerCase().includes(query);

      const matchesCategory =
        !filter.category ||
        item.category.toLowerCase() === filter.category.toLowerCase();
      const matchesMaxPrice =
        !filter.maxPrice || item.price.totalPrice <= filter.maxPrice;
      const matchesMinPrice =
        !filter.minPrice || item.price.totalPrice >= filter.minPrice;
      const matchesCondition =
        !filter.condition ||
        item.variantAttributes.condition === filter.condition;

      if (
        matchesQuery &&
        matchesCategory &&
        matchesMaxPrice &&
        matchesMinPrice &&
        matchesCondition
      ) {
        results.push(this.toNormalizedOffer(item));
      }
    }

    return results;
  }

  async fetchOffer(externalProductId: string): Promise<NormalizedOffer | null> {
    const item = this.inventory.get(externalProductId);
    if (!item) return null;
    return this.toNormalizedOffer(item);
  }

  async revalidateOffer(externalProductId: string): Promise<{
    offer: NormalizedOffer | null;
    isAvailable: boolean;
    priceChanged: boolean;
    currentTotalPrice: number;
  }> {
    const item = this.inventory.get(externalProductId);
    if (!item) {
      return {
        offer: null,
        isAvailable: false,
        priceChanged: false,
        currentTotalPrice: 0,
      };
    }

    const offer = this.toNormalizedOffer(item);
    return {
      offer,
      isAvailable: item.availabilityStatus === "in_stock",
      priceChanged: false,
      currentTotalPrice: item.price.totalPrice,
    };
  }

  /**
   * Helper for tests & simulations: simulate a live price drop or surge
   */
  updateSimulatedPrice(
    externalProductId: string,
    newItemPrice: number,
    newShipping: number = 0,
  ) {
    const item = this.inventory.get(externalProductId);
    if (item) {
      item.price.itemPrice = newItemPrice;
      item.price.shippingPrice = newShipping;
      item.price.totalPrice = newItemPrice + newShipping + item.price.fees;
    }
  }

  /**
   * Helper for tests & simulations: update stock status
   */
  updateSimulatedStock(
    externalProductId: string,
    status: "in_stock" | "out_of_stock" | "preorder",
  ) {
    const item = this.inventory.get(externalProductId);
    if (item) {
      item.availabilityStatus = status;
    }
  }

  private toNormalizedOffer(seed: MockProductSeed): NormalizedOffer {
    return {
      sourceId: this.sourceId,
      externalProductId: seed.externalProductId,
      offerUrl: `https://mockretailer.com/p/${seed.externalProductId}`,
      canonicalProductId: seed.canonicalProductId,
      title: seed.title,
      brand: seed.brand,
      model: seed.model,
      category: seed.category,
      imageUrl: seed.imageUrl,
      variantAttributes: seed.variantAttributes,
      seller: seed.seller,
      price: { ...seed.price },
      availabilityStatus: seed.availabilityStatus,
      freshnessStatus: "fresh",
      sourceConfidence: 1.0,
      observedAt: new Date(),
    };
  }
}

export const mockCatalogAdapter = new MockCatalogAdapter();
