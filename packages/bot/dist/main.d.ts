import { Bot } from "grammy";
export declare function createBot(token: string): Bot<import("grammy").Context, import("grammy").Api<import("grammy").RawApi>>;
export declare function startBot(): Promise<void>;
