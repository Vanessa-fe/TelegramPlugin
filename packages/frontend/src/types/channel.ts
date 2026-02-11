export enum ChannelProvider {
  TELEGRAM = 'TELEGRAM',
  DISCORD = 'DISCORD',
  WHATSAPP = 'WHATSAPP',
}

export enum ChannelType {
  CHANNEL = 'CHANNEL',
  GROUP = 'GROUP',
}

export enum VerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  EXPIRED = 'EXPIRED',
  USED = 'USED',
}

export enum AccessStatus {
  PENDING = 'PENDING',
  GRANTED = 'GRANTED',
  REVOKE_PENDING = 'REVOKE_PENDING',
  REVOKED = 'REVOKED',
}

export interface ChannelVerification {
  id: string;
  code: string;
  type: ChannelType;
  provider: ChannelProvider;
  expiresAt: string;
}

export interface VerificationStatusResponse {
  status: VerificationStatus;
  provider: ChannelProvider;
  type?: ChannelType;
  // Telegram fields
  telegramChatId?: string | null;
  telegramTitle?: string | null;
  telegramUsername?: string | null;
  // Discord fields
  discordGuildId?: string | null;
  discordGuildName?: string | null;
  discordRoleId?: string | null;
  discordRoleName?: string | null;
}

export interface DiscordGuild {
  id: string;
  channelId: string;
  guildId: string;
  guildName?: string | null;
  roleId?: string | null;
  roleName?: string | null;
  botJoinedAt?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface DiscordRole {
  id: string;
  name: string;
  color?: string;
  position?: number;
}

export interface Channel {
  id: string;
  organizationId: string;
  provider: ChannelProvider;
  type?: ChannelType;
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
  type?: ChannelType;
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
  type?: ChannelType;
  title?: string;
  username?: string;
  inviteLink?: string;
  isActive?: boolean;
  metadata?: Record<string, unknown>;
}
