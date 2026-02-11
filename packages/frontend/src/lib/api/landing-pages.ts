import axios from 'axios';
import apiClient from '../api-client';
import type {
  LandingPage,
  LandingPageElement,
  CreateLandingPageDto,
  UpdateLandingPageDto,
  CreateElementDto,
  UpdateElementDto,
  BulkUpdateElementsDto,
  ReorderElementsDto,
  UpdateSocialLinksDto,
  PublicLandingPage,
} from '@/types/landing-page';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

// Client sans authentification pour les endpoints publics
const publicClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const landingPagesApi = {
  // Get current user's landing page
  async getMyLandingPage() {
    const { data } = await apiClient.get<LandingPage | null>('/landing-pages/me');
    return data;
  },

  // Create landing page
  async create(dto: CreateLandingPageDto = {}) {
    const { data } = await apiClient.post<LandingPage>('/landing-pages', dto);
    return data;
  },

  // Update landing page config
  async update(dto: UpdateLandingPageDto) {
    const { data } = await apiClient.patch<LandingPage>('/landing-pages/me', dto);
    return data;
  },

  // Publish landing page
  async publish() {
    const { data } = await apiClient.post<LandingPage>('/landing-pages/me/publish');
    return data;
  },

  // Unpublish landing page
  async unpublish() {
    const { data } = await apiClient.post<LandingPage>('/landing-pages/me/unpublish');
    return data;
  },

  // Elements
  async bulkUpdateElements(dto: BulkUpdateElementsDto) {
    const { data } = await apiClient.put<LandingPage>('/landing-pages/me/elements', dto);
    return data;
  },

  async addElement(dto: CreateElementDto) {
    const { data } = await apiClient.post<LandingPageElement>('/landing-pages/me/elements', dto);
    return data;
  },

  async updateElement(id: string, dto: UpdateElementDto) {
    const { data } = await apiClient.patch<LandingPageElement>(
      `/landing-pages/me/elements/${id}`,
      dto
    );
    return data;
  },

  async deleteElement(id: string) {
    const { data } = await apiClient.delete(`/landing-pages/me/elements/${id}`);
    return data;
  },

  async reorderElements(dto: ReorderElementsDto) {
    const { data } = await apiClient.put<LandingPage>(
      '/landing-pages/me/elements/reorder',
      dto
    );
    return data;
  },

  // Social links
  async updateSocialLinks(dto: UpdateSocialLinksDto) {
    const { data } = await apiClient.put<LandingPage>(
      '/landing-pages/me/social-links',
      dto
    );
    return data;
  },

  // Page slug (custom URL)
  async getPageSlug() {
    const { data } = await apiClient.get<{ slug: string; pageSlug: string | null }>(
      '/landing-pages/me/slug'
    );
    return data;
  },

  async updatePageSlug(pageSlug: string | null) {
    const { data } = await apiClient.patch<{ slug: string; pageSlug: string | null }>(
      '/landing-pages/me/slug',
      { pageSlug }
    );
    return data;
  },

  // Public storefront (no auth required)
  async getPublicPage(creatorSlug: string, pageSlug?: string) {
    const path = pageSlug
      ? `/storefront/pages/${creatorSlug}/${pageSlug}`
      : `/storefront/pages/${creatorSlug}`;
    const { data } = await publicClient.get<PublicLandingPage>(path);
    return data;
  },
};
