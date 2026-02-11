import { Client, GuildMember, Role } from "discord.js";
type BotConfig = {
    token: string;
    apiBaseUrl: string;
};
type RoleGrantResult = {
    success: boolean;
    message?: string;
};
export declare function createBot(config: BotConfig): {
    client: Client<boolean>;
    grantRole: (member: GuildMember, role: Role) => Promise<boolean>;
    revokeRole: (member: GuildMember, role: Role) => Promise<boolean>;
    sendDM: (userId: string, message: string) => Promise<boolean>;
    grantAccessToUser(guildId: string, roleId: string, discordUserId: string): Promise<RoleGrantResult>;
    revokeAccessFromUser(guildId: string, roleId: string, discordUserId: string): Promise<RoleGrantResult>;
    getGuildInfo(guildId: string): Promise<{
        id: string;
        name: string;
        memberCount: number;
        roles: {
            id: string;
            name: string;
            color: `#${string}`;
            position: number;
        }[];
        hasPermissions: boolean;
    } | null>;
};
export declare function startBot(): Promise<{
    client: Client<boolean>;
    grantRole: (member: GuildMember, role: Role) => Promise<boolean>;
    revokeRole: (member: GuildMember, role: Role) => Promise<boolean>;
    sendDM: (userId: string, message: string) => Promise<boolean>;
    grantAccessToUser(guildId: string, roleId: string, discordUserId: string): Promise<RoleGrantResult>;
    revokeAccessFromUser(guildId: string, roleId: string, discordUserId: string): Promise<RoleGrantResult>;
    getGuildInfo(guildId: string): Promise<{
        id: string;
        name: string;
        memberCount: number;
        roles: {
            id: string;
            name: string;
            color: `#${string}`;
            position: number;
        }[];
        hasPermissions: boolean;
    } | null>;
}>;
export {};
