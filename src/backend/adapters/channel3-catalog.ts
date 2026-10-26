import { CatalogAdapter, CatalogSearchFilter } from './catalog-adapter';
import { NormalizedOffer } from '../contracts/offer';
import { indiaCommerceAdapter } from './commerce-catalog';
import { mockCatalogAdapter } from './mock-catalog';

export class Channel3CatalogAdapter implements CatalogAdapter {
  readonly sourceId = 'channel3';
  readonly name = 'Channel3 Commercial Adapter';

  async search(filter: CatalogSearchFilter): Promise<NormalizedOffer[]> {
    // Delegates to domestic Indian commerce engine or mock adapter
    const offers = await indiaCommerceAdapter.search(filter);
    if (offers.length > 0) return offers;
    return mockCatalogAdapter.search(filter);
  }

  async fetchOffer(externalProductId: string): Promise<NormalizedOffer | null> {
    return indiaCommerceAdapter.fetchOffer(externalProductId);
  }

  async revalidateOffer(externalProductId: string): Promise<{
    offer: NormalizedOffer | null;
    isAvailable: boolean;
    priceChanged: boolean;
    currentTotalPrice: number;
  }> {
    return indiaCommerceAdapter.revalidateOffer(externalProductId);
  }
}

export const channel3CatalogAdapter = new Channel3CatalogAdapter();
