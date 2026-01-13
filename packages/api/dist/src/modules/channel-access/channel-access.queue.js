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
let ChannelAccessQueue = ChannelAccessQueue_1 = class ChannelAccessQueue {
    config;
    logger = new common_1.Logger(ChannelAccessQueue_1.name);
    connection;
    grantQueue;
    revokeQueue;
    constructor(config) {
        this.config = config;
        const redisUrl = this.config.get('REDIS_URL');
        if (!redisUrl) {
            throw new Error('REDIS_URL is not configured');
        }
        this.connection = new ioredis_1.default(redisUrl);
        this.grantQueue = new bullmq_1.Queue(shared_1.queueNames.grantAccess, {
            connection: this.connection,
            defaultJobOptions: {
                removeOnComplete: true,
                attempts: 5,
                backoff: {
                    type: 'exponential',
                    delay: 5000,
                },
            },
        });
        this.revokeQueue = new bullmq_1.Queue(shared_1.queueNames.revokeAccess, {
            connection: this.connection,
            defaultJobOptions: {
                removeOnComplete: true,
                attempts: 5,
                backoff: {
                    type: 'exponential',
                    delay: 5000,
                },
            },
        });
    }
    async onModuleDestroy() {
        await Promise.all([
            this.grantQueue.close(),
            this.revokeQueue.close(),
            this.connection.quit(),
        ]).catch((error) => {
            this.logger.error('Error shutting down ChannelAccessQueue', error);
        });
    }
    async enqueueGrantAccess(payload) {
        const data = shared_1.GrantAccessPayload.parse(payload);
        const jobId = `grant:${data.subscriptionId}:${data.channelId}`;
        await this.grantQueue.add(shared_1.queueNames.grantAccess, data, {
            jobId,
            removeOnFail: false,
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
};
exports.ChannelAccessQueue = ChannelAccessQueue;
exports.ChannelAccessQueue = ChannelAccessQueue = ChannelAccessQueue_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ChannelAccessQueue);
//# sourceMappingURL=channel-access.queue.js.map