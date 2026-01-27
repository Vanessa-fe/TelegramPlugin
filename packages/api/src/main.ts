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

  await register(cors, {
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
