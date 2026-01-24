import type { FastifyReply } from 'fastify';
import { MetricsService } from './metrics.service';
export declare class MetricsController {
    private readonly metricsService;
    constructor(metricsService: MetricsService);
    getMetrics(reply: FastifyReply): Promise<void>;
}
