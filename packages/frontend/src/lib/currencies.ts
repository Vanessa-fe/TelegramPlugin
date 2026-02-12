export const ORG_CURRENCY_OPTIONS = [
  'EUR',
  'USD',
  'GBP',
  'CAD',
  'AUD',
  'CHF',
] as const;

export type OrgCurrencyCode = (typeof ORG_CURRENCY_OPTIONS)[number];
