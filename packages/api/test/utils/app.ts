import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import fastifyCookie from '@fastify/cookie';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import fastifyRawBody from 'fastify-raw-body';
import { AppModule } from '../../src/app.module';

export async function createTestApp(): Promise<NestFastifyApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication<NestFastifyApplication>(
    new FastifyAdapter(),
  );

  await app.register(fastifyRawBody, {
    field: 'rawBody',
    global: false,
    runFirst: true,
    routes: ['/webhooks/stripe'],
  });

  await app.register(helmet, {
    contentSecurityPolicy: false,
  });

  const config = app.get(ConfigService);
  await app.register(fastifyCookie, {
    secret: config.getOrThrow<string>('COOKIE_SECRET'),
  });

  await app.register(cors, {
    origin: process.env.CORS_ORIGIN?.split(',') ?? true,
    credentials: true,
  });

  await app.init();
  await app.getHttpAdapter().getInstance().ready();

  return app;
}
