"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentEventsModule = void 0;
const common_1 = require("@nestjs/common");
const payment_events_controller_1 = require("./payment-events.controller");
const payment_events_service_1 = require("./payment-events.service");
let PaymentEventsModule = class PaymentEventsModule {
};
exports.PaymentEventsModule = PaymentEventsModule;
exports.PaymentEventsModule = PaymentEventsModule = __decorate([
    (0, common_1.Module)({
        controllers: [payment_events_controller_1.PaymentEventsController],
        providers: [payment_events_service_1.PaymentEventsService],
        exports: [payment_events_service_1.PaymentEventsService],
    })
], PaymentEventsModule);
//# sourceMappingURL=payment-events.module.js.map