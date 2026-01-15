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
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductDto {
  organizationId: string;
  name: string;
  description?: string;
  status?: ProductStatus;
  metadata?: Record<string, unknown>;
}

export interface UpdateProductDto {
  organizationId?: string;
  name?: string;
  description?: string;
  status?: ProductStatus;
  metadata?: Record<string, unknown>;
}
