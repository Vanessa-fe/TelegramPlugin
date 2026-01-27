import { Test, TestingModule } from '@nestjs/testing';
import { MetricsService } from './metrics.service';

describe('MetricsService', () => {
  let service: MetricsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MetricsService],
    }).compile();

    service = module.get<MetricsService>(MetricsService);
    service.onModuleInit();
  });

  describe('getMetrics', () => {
    it('should return Prometheus-formatted metrics', async () => {
      const metrics = await service.getMetrics();

      expect(metrics).toContain('# HELP webhook_requests_total');
      expect(metrics).toContain('# TYPE webhook_requests_total counter');
      expect(metrics).toContain('# HELP webhook_duration_seconds');
      expect(metrics).toContain('# TYPE webhook_duration_seconds histogram');
      expect(metrics).toContain('# HELP queue_jobs_total');
      expect(metrics).toContain('# TYPE queue_jobs_total counter');
      expect(metrics).toContain('# HELP queue_waiting_jobs');
      expect(metrics).toContain('# TYPE queue_waiting_jobs gauge');
    });

    it('should include default Node.js metrics', async () => {
      const metrics = await service.getMetrics();

      expect(metrics).toContain('nodejs_');
      expect(metrics).toContain('process_');
    });
  });

  describe('getContentType', () => {
    it('should return Prometheus content type', () => {
      const contentType = service.getContentType();

      expect(contentType).toContain('text/plain');
    });
  });

  describe('recordWebhookRequest', () => {
    it('should increment webhook counter for success', async () => {
      service.recordWebhookRequest(
        'stripe',
        'checkout.session.completed',
        'success',
      );

      const metrics = await service.getMetrics();
      expect(metrics).toContain(
        'webhook_requests_total{provider="stripe",event_type="checkout.session.completed",status="success"} 1',
      );
    });

    it('should increment webhook counter for error', async () => {
      service.recordWebhookRequest('stripe', 'invoice.payment_failed', 'error');

      const metrics = await service.getMetrics();
      expect(metrics).toContain(
        'webhook_requests_total{provider="stripe",event_type="invoice.payment_failed",status="error"} 1',
      );
    });

    it('should accumulate multiple requests', async () => {
      service.recordWebhookRequest(
        'stripe',
        'checkout.session.completed',
        'success',
      );
      service.recordWebhookRequest(
        'stripe',
        'checkout.session.completed',
        'success',
      );
      service.recordWebhookRequest(
        'stripe',
        'checkout.session.completed',
        'success',
      );

      const metrics = await service.getMetrics();
      expect(metrics).toContain(
        'webhook_requests_total{provider="stripe",event_type="checkout.session.completed",status="success"} 3',
      );
    });
  });

  describe('recordWebhookDuration', () => {
    it('should record webhook duration in histogram', async () => {
      service.recordWebhookDuration(
        'stripe',
        'checkout.session.completed',
        0.5,
      );

      const metrics = await service.getMetrics();
      expect(metrics).toContain(
        'webhook_duration_seconds_bucket{le="0.5",provider="stripe",event_type="checkout.session.completed"}',
      );
      expect(metrics).toContain(
        'webhook_duration_seconds_count{provider="stripe",event_type="checkout.session.completed"} 1',
      );
    });
  });

  describe('recordQueueJob', () => {
    it('should increment queue job counter for completed', async () => {
      service.recordQueueJob('grant-access', 'completed');

      const metrics = await service.getMetrics();
      expect(metrics).toContain(
        'queue_jobs_total{queue="grant-access",status="completed"} 1',
      );
    });

    it('should increment queue job counter for failed', async () => {
      service.recordQueueJob('revoke-access', 'failed');

      const metrics = await service.getMetrics();
      expect(metrics).toContain(
        'queue_jobs_total{queue="revoke-access",status="failed"} 1',
      );
    });
  });

  describe('recordQueueJobDuration', () => {
    it('should record queue job duration in histogram', async () => {
      service.recordQueueJobDuration('grant-access', 1.5);

      const metrics = await service.getMetrics();
      expect(metrics).toContain(
        'queue_job_duration_seconds_bucket{le="2",queue="grant-access"}',
      );
      expect(metrics).toContain(
        'queue_job_duration_seconds_count{queue="grant-access"} 1',
      );
    });
  });

  describe('setQueueWaitingJobs', () => {
    it('should set queue waiting jobs gauge', async () => {
      service.setQueueWaitingJobs('grant-access', 5);

      const metrics = await service.getMetrics();
      expect(metrics).toContain('queue_waiting_jobs{queue="grant-access"} 5');
    });

    it('should update gauge value on subsequent calls', async () => {
      service.setQueueWaitingJobs('grant-access', 5);
      service.setQueueWaitingJobs('grant-access', 10);

      const metrics = await service.getMetrics();
      expect(metrics).toContain('queue_waiting_jobs{queue="grant-access"} 10');
    });

    it('should track multiple queues independently', async () => {
      service.setQueueWaitingJobs('grant-access', 5);
      service.setQueueWaitingJobs('revoke-access', 3);

      const metrics = await service.getMetrics();
      expect(metrics).toContain('queue_waiting_jobs{queue="grant-access"} 5');
      expect(metrics).toContain('queue_waiting_jobs{queue="revoke-access"} 3');
    });
  });
});
