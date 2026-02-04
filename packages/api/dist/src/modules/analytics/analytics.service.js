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
var AnalyticsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let AnalyticsService = AnalyticsService_1 = class AnalyticsService {
    config;
    logger = new common_1.Logger(AnalyticsService_1.name);
    measurementId;
    apiSecret;
    enabled;
    constructor(config) {
        this.config = config;
        this.measurementId = this.config.get('GA4_MEASUREMENT_ID');
        this.apiSecret = this.config.get('GA4_API_SECRET');
        this.enabled = !!(this.measurementId && this.apiSecret);
        if (!this.enabled) {
            this.logger.warn('GA4 analytics disabled: GA4_MEASUREMENT_ID or GA4_API_SECRET not configured');
        }
    }
    async trackPurchase(params) {
        if (!this.enabled) {
            return;
        }
        const clientId = params.clientId || this.generateClientId();
        const payload = {
            client_id: clientId,
            events: [
                {
                    name: 'purchase',
                    params: {
                        transaction_id: params.transactionId,
                        value: params.value,
                        currency: params.currency,
                    },
                },
            ],
        };
        try {
            const url = `https://www.google-analytics.com/mp/collect?measurement_id=${this.measurementId}&api_secret=${this.apiSecret}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                this.logger.error(`GA4 purchase event failed: ${response.status} ${response.statusText}`);
                return;
            }
            this.logger.debug(`GA4 purchase event sent: ${params.transactionId} - ${params.value} ${params.currency}`);
        }
        catch (error) {
            this.logger.error('Failed to send GA4 purchase event', error);
        }
    }
    generateClientId() {
        return `${Math.random().toString(36).substring(2)}.${Date.now()}`;
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = AnalyticsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map