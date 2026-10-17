import { CatalogAdapter, CatalogSearchFilter } from './catalog-adapter';
import { NormalizedOffer } from '../contracts/offer';

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
    condition: 'new' | 'refurbished' | 'open_box';
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
  availabilityStatus: 'in_stock' | 'out_of_stock' | 'preorder';
}

const DEFAULT_SEEDS: MockProductSeed[] = [
  {
    externalProductId: 'mock-sony-xm5-black',
    canonicalProductId: 'sony-wh-1000xm5',
    title: 'Sony WH-1000XM5 Wireless Noise-Canceling Headphones - Black',
    brand: 'Sony',
    model: 'WH-1000XM5',
    category: 'Headphones',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=60',
    variantAttributes: { color: 'Black', condition: 'new' },
    seller: { id: 'seller-sony-direct', name: 'Sony Official Store', isAuthorized: true, rating: 4.8, reviewCount: 1240 },
    price: { itemPrice: 19499, shippingPrice: 0, fees: 0, currency: 'INR', totalPrice: 19499 },
    availabilityStatus: 'in_stock',
  },
  {
    externalProductId: 'mock-sony-xm5-silver-refurb',
    canonicalProductId: 'sony-wh-1000xm5',
    title: 'Sony WH-1000XM5 Noise-Canceling Headphones - Silver (Refurbished)',
    brand: 'Sony',
    model: 'WH-1000XM5',
    category: 'Headphones',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=60',
    variantAttributes: { color: 'Silver', condition: 'refurbished' },
    seller: { id: 'seller-refurb-hub', name: 'Refurbished Tech Direct', isAuthorized: false, rating: 4.1, reviewCount: 310 },
    price: { itemPrice: 15999, shippingPrice: 499, fees: 0, currency: 'INR', totalPrice: 16498 },
    availabilityStatus: 'in_stock',
  },
  {
    externalProductId: 'mock-bose-qc45',
    canonicalProductId: 'bose-quietcomfort-45',
    title: 'Bose QuietComfort 45 Bluetooth Wireless Headphones',
    brand: 'Bose',
    model: 'QuietComfort 45',
    category: 'Headphones',
    imageUrl: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&auto=format&fit=crop&q=60',
    variantAttributes: { color: 'Triple Black', condition: 'new' },
    seller: { id: 'seller-bose-official', name: 'Bose Authorized Dealer', isAuthorized: true, rating: 4.9, reviewCount: 3400 },
    price: { itemPrice: 18990, shippingPrice: 0, fees: 0, currency: 'INR', totalPrice: 18990 },
    availabilityStatus: 'in_stock',
  },
  {
    externalProductId: 'mock-airpods-max-spacegray',
    canonicalProductId: 'apple-airpods-max',
    title: 'Apple AirPods Max Over-Ear Headphones - Space Gray',
    brand: 'Apple',
    model: 'AirPods Max',
    category: 'Headphones',
    imageUrl: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&auto=format&fit=crop&q=60',
    variantAttributes: { color: 'Space Gray', condition: 'new' },
    seller: { id: 'seller-apple-reseller', name: 'iPlanet Authorized Apple Reseller', isAuthorized: true, rating: 4.7, reviewCount: 890 },
    price: { itemPrice: 48900, shippingPrice: 0, fees: 0, currency: 'INR', totalPrice: 48900 },
    availabilityStatus: 'in_stock',
  },
  {
    externalProductId: 'mock-dell-xps-15',
    canonicalProductId: 'dell-xps-15-9530',
    title: 'Dell XPS 15 9530 Laptop (13th Gen Intel i7, 16GB, 512GB SSD, RTX 4050)',
    brand: 'Dell',
    model: 'XPS 15 9530',
    category: 'Laptops',
    imageUrl: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800&auto=format&fit=crop&q=60',
    variantAttributes: { color: 'Platinum Silver', storage: '512GB', condition: 'new' },
    seller: { id: 'seller-dell-direct', name: 'Dell Technologies India', isAuthorized: true, rating: 4.8, reviewCount: 420 },
    price: { itemPrice: 149990, shippingPrice: 0, fees: 0, currency: 'INR', totalPrice: 149990 },
    availabilityStatus: 'in_stock',
  },
  {
    externalProductId: 'mock-lg-ultragear-27',
    canonicalProductId: 'lg-ultragear-27gp850',
    title: 'LG UltraGear 27GP850-B 27" QHD Nano IPS 165Hz Gaming Monitor',
    brand: 'LG',
    model: '27GP850-B',
    category: 'Monitors',
    imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&auto=format&fit=crop&q=60',
    variantAttributes: { color: 'Black/Red', condition: 'new' },
    seller: { id: 'seller-electronics-hub', name: 'Prime Displays Store', isAuthorized: true, rating: 4.6, reviewCount: 650 },
    price: { itemPrice: 28499, shippingPrice: 0, fees: 0, currency: 'INR', totalPrice: 28499 },
    availabilityStatus: 'in_stock',
  }
];

export class MockCatalogAdapter implements CatalogAdapter {
  sourceId = 'mock_retailer';
  name = 'DealPilot Mock Catalog Adapter';
  private inventory: Map<string, MockProductSeed>;

  constructor(customSeeds?: MockProductSeed[]) {
    this.inventory = new Map();
    const seeds = customSeeds || DEFAULT_SEEDS;
    for (const seed of seeds) {
      this.inventory.set(seed.externalProductId, { ...seed });
    }
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

      const matchesCategory = !filter.category || item.category.toLowerCase() === filter.category.toLowerCase();
      const matchesMaxPrice = !filter.maxPrice || item.price.totalPrice <= filter.maxPrice;
      const matchesMinPrice = !filter.minPrice || item.price.totalPrice >= filter.minPrice;
      const matchesCondition = !filter.condition || item.variantAttributes.condition === filter.condition;

      if (matchesQuery && matchesCategory && matchesMaxPrice && matchesMinPrice && matchesCondition) {
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
      return { offer: null, isAvailable: false, priceChanged: false, currentTotalPrice: 0 };
    }

    const offer = this.toNormalizedOffer(item);
    return {
      offer,
      isAvailable: item.availabilityStatus === 'in_stock',
      priceChanged: false,
      currentTotalPrice: item.price.totalPrice,
    };
  }

  /**
   * Helper for tests & simulations: simulate a live price drop or surge
   */
  updateSimulatedPrice(externalProductId: string, newItemPrice: number, newShipping: number = 0) {
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
  updateSimulatedStock(externalProductId: string, status: 'in_stock' | 'out_of_stock' | 'preorder') {
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
      freshnessStatus: 'fresh',
      sourceConfidence: 1.0,
      observedAt: new Date(),
    };
  }
}

export const mockCatalogAdapter = new MockCatalogAdapter();
