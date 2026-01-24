"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsService = void 0;
const common_1 = require("@nestjs/common");
const prom_client_1 = require("prom-client");
let MetricsService = class MetricsService {
    registry;
    webhookRequestsTotal;
    webhookDurationSeconds;
    queueJobsTotal;
    queueJobDurationSeconds;
    queueWaitingJobs;
    constructor() {
        this.registry = new prom_client_1.Registry();
        this.webhookRequestsTotal = new prom_client_1.Counter({
            name: 'webhook_requests_total',
            help: 'Total number of webhook requests received',
            labelNames: ['provider', 'event_type', 'status'],
            registers: [this.registry],
        });
        this.webhookDurationSeconds = new prom_client_1.Histogram({
            name: 'webhook_duration_seconds',
            help: 'Duration of webhook processing in seconds',
            labelNames: ['provider', 'event_type'],
            buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10],
            registers: [this.registry],
        });
        this.queueJobsTotal = new prom_client_1.Counter({
            name: 'queue_jobs_total',
            help: 'Total number of queue jobs processed',
            labelNames: ['queue', 'status'],
            registers: [this.registry],
        });
        this.queueJobDurationSeconds = new prom_client_1.Histogram({
            name: 'queue_job_duration_seconds',
            help: 'Duration of queue job processing in seconds',
            labelNames: ['queue'],
            buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60],
            registers: [this.registry],
        });
        this.queueWaitingJobs = new prom_client_1.Gauge({
            name: 'queue_waiting_jobs',
            help: 'Number of jobs waiting in queue',
            labelNames: ['queue'],
            registers: [this.registry],
        });
    }
    onModuleInit() {
        (0, prom_client_1.collectDefaultMetrics)({ register: this.registry });
    }
    async getMetrics() {
        return this.registry.metrics();
    }
    getContentType() {
        return this.registry.contentType;
    }
    recordWebhookRequest(provider, eventType, status) {
        this.webhookRequestsTotal.inc({ provider, event_type: eventType, status });
    }
    recordWebhookDuration(provider, eventType, durationSeconds) {
        this.webhookDurationSeconds.observe({ provider, event_type: eventType }, durationSeconds);
    }
    recordQueueJob(queue, status) {
        this.queueJobsTotal.inc({ queue, status });
    }
    recordQueueJobDuration(queue, durationSeconds) {
        this.queueJobDurationSeconds.observe({ queue }, durationSeconds);
    }
    setQueueWaitingJobs(queue, count) {
        this.queueWaitingJobs.set({ queue }, count);
    }
};
exports.MetricsService = MetricsService;
exports.MetricsService = MetricsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], MetricsService);
//# sourceMappingURL=metrics.service.js.map