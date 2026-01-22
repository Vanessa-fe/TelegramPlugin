import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Client sans authentification pour les endpoints publics
const publicClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface PublicPlan {
  id: string;
  name: string;
  description: string | null;
  interval: 'ONE_TIME' | 'DAY' | 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR';
  priceCents: number;
  currency: string;
  trialPeriodDays: number | null;
  accessDurationDays: number | null;
}

export interface PublicChannel {
  id: string;
  title: string | null;
  provider: 'TELEGRAM' | 'DISCORD';
}

export interface PublicProduct {
  id: string;
  name: string;
  description: string | null;
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  plans: PublicPlan[];
  channels: PublicChannel[];
}

export interface PublicOrganization {
  id: string;
  name: string;
  slug: string;
}

export interface PublicProductSummary {
  id: string;
  name: string;
  description: string | null;
  plans: Omit<PublicPlan, 'trialPeriodDays' | 'accessDurationDays'>[];
}

export const storefrontApi = {
  async getProduct(productId: string): Promise<PublicProduct> {
    const { data } = await publicClient.get<PublicProduct>(
      `/storefront/products/${productId}`
    );
    return data;
  },

  async getOrganization(slug: string): Promise<PublicOrganization> {
    const { data } = await publicClient.get<PublicOrganization>(
      `/storefront/organizations/${slug}`
    );
    return data;
  },

  async getOrganizationProducts(slug: string): Promise<PublicProductSummary[]> {
    const { data } = await publicClient.get<PublicProductSummary[]>(
      `/storefront/organizations/${slug}/products`
    );
    return data;
  },
};
