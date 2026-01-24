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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var ChannelAccessQueue_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelAccessQueue = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const shared_1 = require("@telegram-plugin/shared");
const metrics_service_1 = require("../metrics/metrics.service");
let ChannelAccessQueue = class ChannelAccessQueue {
    static { ChannelAccessQueue_1 = this; }
    config;
    metricsService;
    logger = new common_1.Logger(ChannelAccessQueue_1.name);
    connection;
    grantQueue;
    revokeQueue;
    grantDlq;
    revokeDlq;
    metricsInterval = null;
    static RETRY_ATTEMPTS = 10;
    static RETRY_BACKOFF_DELAY_MS = 5 * 60 * 1000;
    static METRICS_INTERVAL_MS = 15_000;
    constructor(config, metricsService) {
        this.config = config;
        this.metricsService = metricsService;
        const redisUrl = this.config.get('REDIS_URL');
        if (!redisUrl) {
            throw new Error('REDIS_URL is not configured');
        }
        this.connection = new ioredis_1.default(redisUrl);
        this.grantQueue = new bullmq_1.Queue(shared_1.queueNames.grantAccess, {
            connection: this.connection,
            defaultJobOptions: {
                removeOnComplete: true,
                attempts: ChannelAccessQueue_1.RETRY_ATTEMPTS,
                backoff: {
                    type: 'exponential',
                    delay: ChannelAccessQueue_1.RETRY_BACKOFF_DELAY_MS,
                },
            },
        });
        this.revokeQueue = new bullmq_1.Queue(shared_1.queueNames.revokeAccess, {
            connection: this.connection,
            defaultJobOptions: {
                removeOnComplete: true,
                attempts: ChannelAccessQueue_1.RETRY_ATTEMPTS,
                backoff: {
                    type: 'exponential',
                    delay: ChannelAccessQueue_1.RETRY_BACKOFF_DELAY_MS,
                },
            },
        });
        this.grantDlq = new bullmq_1.Queue(shared_1.queueNames.grantAccessDlq, {
            connection: this.connection,
        });
        this.revokeDlq = new bullmq_1.Queue(shared_1.queueNames.revokeAccessDlq, {
            connection: this.connection,
        });
    }
    onModuleInit() {
        this.metricsInterval = setInterval(() => {
            this.updateQueueMetrics().catch((error) => {
                this.logger.error('Failed to update queue metrics', error);
            });
        }, ChannelAccessQueue_1.METRICS_INTERVAL_MS);
        this.updateQueueMetrics().catch((error) => {
            this.logger.error('Failed to update initial queue metrics', error);
        });
    }
    async onModuleDestroy() {
        if (this.metricsInterval) {
            clearInterval(this.metricsInterval);
            this.metricsInterval = null;
        }
        await Promise.all([
            this.grantQueue.close(),
            this.revokeQueue.close(),
            this.grantDlq.close(),
            this.revokeDlq.close(),
            this.connection.quit(),
        ]).catch((error) => {
            this.logger.error('Error shutting down ChannelAccessQueue', error);
        });
    }
    async updateQueueMetrics() {
        const [grantCounts, revokeCounts, grantDlqCounts, revokeDlqCounts] = await Promise.all([
            this.grantQueue.getJobCounts('waiting', 'active', 'completed', 'failed'),
            this.revokeQueue.getJobCounts('waiting', 'active', 'completed', 'failed'),
            this.grantDlq.getJobCounts('waiting'),
            this.revokeDlq.getJobCounts('waiting'),
        ]);
        this.metricsService.setQueueWaitingJobs(shared_1.queueNames.grantAccess, grantCounts.waiting + grantCounts.active);
        this.metricsService.setQueueWaitingJobs(shared_1.queueNames.revokeAccess, revokeCounts.waiting + revokeCounts.active);
        this.metricsService.setQueueWaitingJobs(shared_1.queueNames.grantAccessDlq, grantDlqCounts.waiting);
        this.metricsService.setQueueWaitingJobs(shared_1.queueNames.revokeAccessDlq, revokeDlqCounts.waiting);
    }
    async enqueueGrantAccess(payload) {
        const data = shared_1.GrantAccessPayload.parse(payload);
        const jobId = `grant:${data.subscriptionId}:${data.channelId}`;
        await this.grantQueue.add(shared_1.queueNames.grantAccess, data, {
            jobId,
            removeOnFail: false,
            priority: 1,
        });
        this.logger.debug(`Grant access job enqueued (subscription=${data.subscriptionId}, channel=${data.channelId})`);
    }
    async enqueueRevokeAccess(payload) {
        const data = shared_1.RevokeAccessPayload.parse(payload);
        const jobId = `revoke:${data.subscriptionId}:${data.reason}`;
        await this.revokeQueue.add(shared_1.queueNames.revokeAccess, data, {
            jobId,
            removeOnFail: false,
        });
        this.logger.debug(`Revoke access job enqueued (subscription=${data.subscriptionId}, reason=${data.reason})`);
    }
    async replayGrantAccess(jobId) {
        await this.replayDeadLetter(this.grantDlq, this.grantQueue, shared_1.GrantAccessPayload, jobId, shared_1.queueNames.grantAccess);
    }
    async replayRevokeAccess(jobId) {
        await this.replayDeadLetter(this.revokeDlq, this.revokeQueue, shared_1.RevokeAccessPayload, jobId, shared_1.queueNames.revokeAccess);
    }
    async replayDeadLetter(dlq, target, schema, jobId, jobName) {
        const job = await dlq.getJob(jobId);
        if (!job) {
            throw new Error(`DLQ job ${jobId} not found`);
        }
        const payloadContainer = job.data;
        const payload = payloadContainer.payload ?? job.data;
        const parsed = schema.parse(payload);
        const originalJobId = payloadContainer.originalJobId ?? String(job.id ?? jobId);
        const existing = await target.getJob(originalJobId);
        if (existing) {
            await existing.remove();
        }
        await target.add(jobName, parsed, {
            jobId: originalJobId,
            removeOnFail: false,
        });
        await job.remove();
    }
};
exports.ChannelAccessQueue = ChannelAccessQueue;
exports.ChannelAccessQueue = ChannelAccessQueue = ChannelAccessQueue_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        metrics_service_1.MetricsService])
], ChannelAccessQueue);
//# sourceMappingURL=channel-access.queue.js.map