export enum ProductStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
}

export interface Product {
  id: string;
  organizationId: string;
  name: string;
  description?: string | null;
  status: ProductStatus;
  metadata?: Record<string, unknown> | null;
  channelIds?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductDto {
  organizationId: string;
  name: string;
  description?: string;
  status?: ProductStatus;
  metadata?: Record<string, unknown>;
  channelIds?: string[];
}

export interface UpdateProductDto {
  organizationId?: string;
  name?: string;
  description?: string;
  status?: ProductStatus;
  metadata?: Record<string, unknown>;
  channelIds?: string[];
}
