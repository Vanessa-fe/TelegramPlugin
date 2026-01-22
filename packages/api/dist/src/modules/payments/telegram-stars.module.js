"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramStarsModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_module_1 = require("../../prisma/prisma.module");
const channel_access_module_1 = require("../channel-access/channel-access.module");
const telegram_stars_controller_1 = require("./telegram-stars.controller");
const telegram_stars_service_1 = require("./telegram-stars.service");
let TelegramStarsModule = class TelegramStarsModule {
};
exports.TelegramStarsModule = TelegramStarsModule;
exports.TelegramStarsModule = TelegramStarsModule = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule, prisma_module_1.PrismaModule, channel_access_module_1.ChannelAccessModule],
        controllers: [telegram_stars_controller_1.TelegramStarsController],
        providers: [telegram_stars_service_1.TelegramStarsService],
    })
], TelegramStarsModule);
//# sourceMappingURL=telegram-stars.module.js.map