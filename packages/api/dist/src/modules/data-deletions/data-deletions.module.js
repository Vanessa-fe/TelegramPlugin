"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataDeletionsModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_module_1 = require("../../prisma/prisma.module");
const channel_access_module_1 = require("../channel-access/channel-access.module");
const audit_log_module_1 = require("../audit-log/audit-log.module");
const data_deletions_service_1 = require("./data-deletions.service");
let DataDeletionsModule = class DataDeletionsModule {
};
exports.DataDeletionsModule = DataDeletionsModule;
exports.DataDeletionsModule = DataDeletionsModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, channel_access_module_1.ChannelAccessModule, audit_log_module_1.AuditLogModule],
        providers: [data_deletions_service_1.DataDeletionsService],
        exports: [data_deletions_service_1.DataDeletionsService],
    })
], DataDeletionsModule);
//# sourceMappingURL=data-deletions.module.js.map