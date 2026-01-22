export enum ChannelProvider {
  TELEGRAM = 'TELEGRAM',
  DISCORD = 'DISCORD',
}

export enum AccessStatus {
  PENDING = 'PENDING',
  GRANTED = 'GRANTED',
  REVOKED = 'REVOKED',
}

export interface Channel {
  id: string;
  organizationId: string;
  provider: ChannelProvider;
  externalId: string;
  title?: string | null;
  username?: string | null;
  inviteLink?: string | null;
  isActive: boolean;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChannelAccess {
  id: string;
  subscriptionId: string;
  channelId: string;
  customerId: string;
  inviteId?: string | null;
  status: AccessStatus;
  grantedAt?: string | null;
  revokedAt?: string | null;
  revokeReason?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateChannelDto {
  organizationId: string;
  provider: ChannelProvider;
  externalId: string;
  title?: string;
  username?: string;
  inviteLink?: string;
  isActive?: boolean;
  metadata?: Record<string, unknown>;
}

export interface UpdateChannelDto {
  organizationId?: string;
  provider?: ChannelProvider;
  externalId?: string;
  title?: string;
  username?: string;
  inviteLink?: string;
  isActive?: boolean;
  metadata?: Record<string, unknown>;
}
