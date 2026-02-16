"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AffiliatesModule = void 0;
const common_1 = require("@nestjs/common");
const affiliates_controller_1 = require("./affiliates.controller");
const affiliates_service_1 = require("./affiliates.service");
let AffiliatesModule = class AffiliatesModule {
};
exports.AffiliatesModule = AffiliatesModule;
exports.AffiliatesModule = AffiliatesModule = __decorate([
    (0, common_1.Module)({
        controllers: [affiliates_controller_1.AffiliatesController],
        providers: [affiliates_service_1.AffiliatesService],
        exports: [affiliates_service_1.AffiliatesService],
    })
], AffiliatesModule);
//# sourceMappingURL=affiliates.module.js.map