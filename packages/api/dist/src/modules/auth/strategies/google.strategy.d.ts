import { ConfigService } from '@nestjs/config';
import { Strategy, Profile } from 'passport-google-oauth20';
export interface GoogleProfile {
    provider: 'google';
    providerId: string;
    email: string;
    firstName?: string;
    lastName?: string;
}
declare const GoogleStrategy_base: new (...args: [options: import("passport-google-oauth20").StrategyOptionsWithRequest] | [options: import("passport-google-oauth20").StrategyOptions] | [options: import("passport-google-oauth20").StrategyOptions] | [options: import("passport-google-oauth20").StrategyOptionsWithRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class GoogleStrategy extends GoogleStrategy_base {
    constructor(config: ConfigService);
    validate(_accessToken: string, _refreshToken: string, profile: Profile): GoogleProfile;
}
export {};
