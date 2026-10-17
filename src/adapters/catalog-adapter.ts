import { NormalizedOffer } from '../contracts/offer';

export interface CatalogSearchFilter {
  query: string;
  category?: string;
  maxPrice?: number;
  minPrice?: number;
  condition?: 'new' | 'refurbished' | 'open_box';
}

export interface CatalogAdapter {
  sourceId: string;
  name: string;
  search(filter: CatalogSearchFilter): Promise<NormalizedOffer[]>;
  fetchOffer(externalProductId: string): Promise<NormalizedOffer | null>;
  revalidateOffer(externalProductId: string): Promise<{
    offer: NormalizedOffer | null;
    isAvailable: boolean;
    priceChanged: boolean;
    currentTotalPrice: number;
  }>;
}
