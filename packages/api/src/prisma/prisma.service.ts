import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Logger } from 'nestjs-pino';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(private readonly logger: Logger) {
    super({
      log:
        process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
  }

  async onModuleInit() {
    if (process.env.NODE_ENV === 'test') {
      this.logger.warn('[Prisma] connexion ignorée en environnement test');
      return;
    }

    await this.$connect();
    this.logger.log('[Prisma] connexion établie');
  }

  async onModuleDestroy() {
    if (process.env.NODE_ENV === 'test') {
      return;
    }

    await this.$disconnect();
    this.logger.log('[Prisma] connexion fermée');
  }
}
