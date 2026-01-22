export interface Customer {
  id: string;
  organizationId: string;
  email?: string | null;
  displayName?: string | null;
  telegramUserId?: string | null;
  telegramUsername?: string | null;
  externalId?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerDto {
  organizationId: string;
  email?: string;
  displayName?: string;
  telegramUserId?: string;
  telegramUsername?: string;
  externalId?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateCustomerDto {
  organizationId?: string;
  email?: string;
  displayName?: string;
  telegramUserId?: string;
  telegramUsername?: string;
  externalId?: string;
  metadata?: Record<string, unknown>;
}
