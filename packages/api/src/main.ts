import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import fastifyCookie from '@fastify/cookie';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import fastifyRawBody from 'fastify-raw-body';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  const register = app.register.bind(app) as (
    plugin: any,
    opts?: any,
  ) => Promise<void>;

  await register(fastifyRawBody, {
    field: 'rawBody',
    global: false,
    runFirst: true,
    routes: ['/webhooks/stripe'],
  });

  await register(helmet, {
    contentSecurityPolicy: false,
  });

  const config = app.get(ConfigService);
  await register(fastifyCookie, {
    secret: config.getOrThrow<string>('COOKIE_SECRET'),
  });

  const allowedOrigins = process.env.CORS_ORIGIN?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const isProduction = process.env.NODE_ENV === 'production';

  // Security: In production, CORS_ORIGIN must be explicitly configured
  // to prevent credentials being sent to arbitrary origins
  if (isProduction && (!allowedOrigins || allowedOrigins.length === 0)) {
    throw new Error(
      'CORS_ORIGIN must be configured in production. ' +
        'Set CORS_ORIGIN to a comma-separated list of allowed origins.',
    );
  }

  await register(cors, {
    origin: allowedOrigins && allowedOrigins.length > 0 ? allowedOrigins : true,
    credentials: true,
  });

  const port = Number(process.env.API_PORT ?? process.env.PORT ?? 3000);
  const host = process.env.HOST ?? '0.0.0.0';

  await app.listen({ port, host });
}
bootstrap().catch((error) => {
  console.error('API bootstrap failed', error);
  process.exitCode = 1;
});
