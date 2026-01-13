"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const helmet_1 = __importDefault(require("@fastify/helmet"));
const cors_1 = __importDefault(require("@fastify/cors"));
const cookie_1 = __importDefault(require("@fastify/cookie"));
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const platform_fastify_1 = require("@nestjs/platform-fastify");
const fastify_raw_body_1 = __importDefault(require("fastify-raw-body"));
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, new platform_fastify_1.FastifyAdapter());
    const register = app.register.bind(app);
    await register(fastify_raw_body_1.default, {
        field: 'rawBody',
        global: false,
        runFirst: true,
        routes: ['/webhooks/stripe'],
    });
    await register(helmet_1.default, {
        contentSecurityPolicy: false,
    });
    const config = app.get(config_1.ConfigService);
    await register(cookie_1.default, {
        secret: config.getOrThrow('COOKIE_SECRET'),
    });
    await register(cors_1.default, {
        origin: process.env.CORS_ORIGIN?.split(',') ?? true,
        credentials: true,
    });
    const port = Number(process.env.PORT ?? 3000);
    const host = process.env.HOST ?? '0.0.0.0';
    await app.listen({ port, host });
}
bootstrap().catch((error) => {
    console.error('API bootstrap failed', error);
    process.exitCode = 1;
});
//# sourceMappingURL=main.js.map