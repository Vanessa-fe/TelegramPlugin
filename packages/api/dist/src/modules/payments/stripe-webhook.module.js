"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeWebhookModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const stripe_webhook_controller_1 = require("./stripe-webhook.controller");
const stripe_webhook_service_1 = require("./stripe-webhook.service");
const channel_access_module_1 = require("../channel-access/channel-access.module");
const audit_log_module_1 = require("../audit-log/audit-log.module");
let StripeWebhookModule = class StripeWebhookModule {
};
exports.StripeWebhookModule = StripeWebhookModule;
exports.StripeWebhookModule = StripeWebhookModule = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule, channel_access_module_1.ChannelAccessModule, audit_log_module_1.AuditLogModule],
        controllers: [stripe_webhook_controller_1.StripeWebhookController],
        providers: [stripe_webhook_service_1.StripeWebhookService],
    })
], StripeWebhookModule);
//# sourceMappingURL=stripe-webhook.module.js.map