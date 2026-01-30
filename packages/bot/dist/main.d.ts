import { Bot } from "grammy";
type BotConfig = {
    token: string;
    apiBaseUrl: string;
    webhookSecret?: string;
};
export declare function createBot(config: BotConfig): Bot<import("grammy").Context, import("grammy").Api<import("grammy").RawApi>>;
export declare function startBot(): Promise<void>;
export {};
