import { ConfigService } from '@nestjs/config';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { OAuthService, OAuthProfile } from './oauth.service';
interface OAuthRequest extends FastifyRequest {
    user?: OAuthProfile;
    oauthError?: string;
}
export declare class OAuthController {
    private readonly oauthService;
    private readonly config;
    constructor(oauthService: OAuthService, config: ConfigService);
    googleAuth(): void;
    googleCallback(req: OAuthRequest, reply: FastifyReply): Promise<void>;
}
export {};
