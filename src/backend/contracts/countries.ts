export interface CountryConfig {
  code: string;
  name: string;
  flag: string;
  currency: string;
  symbol: string;
  locale: string;
  channel3Country?: string; // Channel3 ISO CountryCode if supported
  channel3Currency?: string; // Channel3 ISO CurrencyCode if supported
}

export const SUPPORTED_COUNTRIES: CountryConfig[] = [
  {
    code: 'IN',
    name: 'India',
    flag: '🇮🇳',
    currency: 'INR',
    symbol: '₹',
    locale: 'en-IN',
    channel3Country: undefined, // Channel3 routes via global/partner merchants for INR
    channel3Currency: undefined,
  },
  {
    code: 'US',
    name: 'United States',
    flag: '🇺🇸',
    currency: 'USD',
    symbol: '$',
    locale: 'en-US',
    channel3Country: 'US',
    channel3Currency: 'USD',
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    flag: '🇬🇧',
    currency: 'GBP',
    symbol: '£',
    locale: 'en-GB',
    channel3Country: 'GB',
    channel3Currency: 'GBP',
  },
  {
    code: 'EU',
    name: 'European Union (Germany/France)',
    flag: '🇪🇺',
    currency: 'EUR',
    symbol: '€',
    locale: 'de-DE',
    channel3Country: 'DE',
    channel3Currency: 'EUR',
  },
  {
    code: 'CA',
    name: 'Canada',
    flag: '🇨🇦',
    currency: 'CAD',
    symbol: 'CA$',
    locale: 'en-CA',
    channel3Country: 'CA',
    channel3Currency: 'CAD',
  },
  {
    code: 'AU',
    name: 'Australia',
    flag: '🇦🇺',
    currency: 'AUD',
    symbol: 'A$',
    locale: 'en-AU',
    channel3Country: 'AU',
    channel3Currency: 'AUD',
  },
];

export const DEFAULT_COUNTRY = SUPPORTED_COUNTRIES[0]; // India (INR)

export function getCountryByCode(code?: string): CountryConfig {
  if (!code) return DEFAULT_COUNTRY;
  const match = SUPPORTED_COUNTRIES.find((c) => c.code.toUpperCase() === code.toUpperCase());
  return match || DEFAULT_COUNTRY;
}
