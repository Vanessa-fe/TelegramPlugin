"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataExportsModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_module_1 = require("../../prisma/prisma.module");
const audit_log_module_1 = require("../audit-log/audit-log.module");
const data_exports_controller_1 = require("./data-exports.controller");
const data_exports_service_1 = require("./data-exports.service");
let DataExportsModule = class DataExportsModule {
};
exports.DataExportsModule = DataExportsModule;
exports.DataExportsModule = DataExportsModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, audit_log_module_1.AuditLogModule, config_1.ConfigModule],
        controllers: [data_exports_controller_1.DataExportsController],
        providers: [data_exports_service_1.DataExportsService],
        exports: [data_exports_service_1.DataExportsService],
    })
], DataExportsModule);
//# sourceMappingURL=data-exports.module.js.map