import type { FastifyRequest } from 'fastify';
import { AuthService } from './auth.service';
import type { AuthUser, AuthResult, AuthProfile } from './auth.types';
import { type LoginDto, type RefreshDto, type RegisterDto } from './auth.schema';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(body: RegisterDto): Promise<AuthResult>;
    login(body: LoginDto): Promise<AuthResult>;
    refresh(body: RefreshDto, req: FastifyRequest): Promise<AuthResult>;
    logout(): {
        message: string;
    };
    me(user: AuthUser): Promise<AuthProfile>;
}
