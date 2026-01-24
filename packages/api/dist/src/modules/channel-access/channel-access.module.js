"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelAccessModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_module_1 = require("../../prisma/prisma.module");
const channel_access_queue_1 = require("./channel-access.queue");
const channel_access_service_1 = require("./channel-access.service");
const channel_access_controller_1 = require("./channel-access.controller");
const notifications_module_1 = require("../notifications/notifications.module");
const audit_log_module_1 = require("../audit-log/audit-log.module");
let ChannelAccessModule = class ChannelAccessModule {
};
exports.ChannelAccessModule = ChannelAccessModule;
exports.ChannelAccessModule = ChannelAccessModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, config_1.ConfigModule, notifications_module_1.NotificationsModule, audit_log_module_1.AuditLogModule],
        controllers: [channel_access_controller_1.ChannelAccessController],
        providers: [channel_access_service_1.ChannelAccessService, channel_access_queue_1.ChannelAccessQueue],
        exports: [channel_access_service_1.ChannelAccessService],
    })
], ChannelAccessModule);
//# sourceMappingURL=channel-access.module.js.map