import { Controller, Get, Header, Res } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { MetricsService } from './metrics.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  @Public()
  async getMetrics(@Res() reply: FastifyReply): Promise<void> {
    const metrics = await this.metricsService.getMetrics();
    const contentType = this.metricsService.getContentType();

    reply.header('Content-Type', contentType).send(metrics);
  }
}
