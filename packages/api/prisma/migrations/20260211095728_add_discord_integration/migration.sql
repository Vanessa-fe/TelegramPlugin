-- AlterTable
ALTER TABLE "ChannelAccess" ADD COLUMN     "discordRoleId" TEXT;

-- AlterTable
ALTER TABLE "ChannelVerification" ADD COLUMN     "discordGuildId" TEXT,
ADD COLUMN     "discordGuildName" TEXT,
ADD COLUMN     "discordRoleId" TEXT,
ADD COLUMN     "discordRoleName" TEXT,
ADD COLUMN     "provider" "ChannelProvider" NOT NULL DEFAULT 'TELEGRAM';

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "discordUserId" TEXT,
ADD COLUMN     "discordUsername" TEXT;

-- CreateTable
CREATE TABLE "DiscordGuild" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "guildName" TEXT,
    "roleId" TEXT,
    "roleName" TEXT,
    "botJoinedAt" TIMESTAMP(3),
    "status" "InviteStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscordGuild_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerDiscordAccount" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "discordUserId" TEXT NOT NULL,
    "discordUsername" TEXT,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerDiscordAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DiscordGuild_channelId_key" ON "DiscordGuild"("channelId");

-- CreateIndex
CREATE INDEX "DiscordGuild_guildId_idx" ON "DiscordGuild"("guildId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerDiscordAccount_customerId_key" ON "CustomerDiscordAccount"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerDiscordAccount_discordUserId_key" ON "CustomerDiscordAccount"("discordUserId");

-- CreateIndex
CREATE INDEX "Customer_organizationId_discordUserId_idx" ON "Customer"("organizationId", "discordUserId");

-- AddForeignKey
ALTER TABLE "DiscordGuild" ADD CONSTRAINT "DiscordGuild_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerDiscordAccount" ADD CONSTRAINT "CustomerDiscordAccount_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
