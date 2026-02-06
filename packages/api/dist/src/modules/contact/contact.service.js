"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ContactService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const Brevo = __importStar(require("@getbrevo/brevo"));
let ContactService = ContactService_1 = class ContactService {
    config;
    logger = new common_1.Logger(ContactService_1.name);
    brevoApi = null;
    brevoEnabled;
    fromEmail;
    fromName;
    toEmail;
    constructor(config) {
        this.config = config;
        this.fromEmail =
            this.config.get('BREVO_FROM_EMAIL') || 'noreply@example.com';
        this.fromName =
            this.config.get('BREVO_FROM_NAME') || 'Sublynk';
        this.toEmail =
            this.config.get('CONTACT_TO_EMAIL') || this.fromEmail;
        const brevoApiKey = this.config.get('BREVO_API_KEY');
        this.brevoEnabled = !!brevoApiKey;
        if (this.brevoEnabled) {
            this.brevoApi = new Brevo.TransactionalEmailsApi();
            this.brevoApi.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, brevoApiKey || '');
            this.logger.log('Brevo contact email service initialized');
        }
        else {
            this.logger.warn('Brevo not configured - contact emails will be logged only');
        }
    }
    async sendContactMessage(dto) {
        const subject = `Contact: ${dto.subject}`;
        const messageHtml = this.renderHtml(dto);
        const messageText = this.renderText(dto);
        if (!this.brevoApi || !this.brevoEnabled) {
            if (process.env.NODE_ENV === 'production') {
                throw new common_1.ServiceUnavailableException('Email service not configured');
            }
            this.logger.log(`[CONTACT - DEV MODE] To: ${this.toEmail}, Subject: ${subject}`);
            this.logger.debug(`[CONTACT - DEV MODE] Body: ${messageText}`);
            return;
        }
        try {
            const sendSmtpEmail = new Brevo.SendSmtpEmail();
            sendSmtpEmail.sender = {
                email: this.fromEmail,
                name: this.fromName,
            };
            sendSmtpEmail.replyTo = {
                email: dto.email,
                name: dto.name,
            };
            sendSmtpEmail.to = [{ email: this.toEmail }];
            sendSmtpEmail.subject = subject;
            sendSmtpEmail.htmlContent = messageHtml;
            sendSmtpEmail.textContent = messageText;
            await this.brevoApi.sendTransacEmail(sendSmtpEmail);
            this.logger.log(`Contact email sent successfully to ${this.toEmail}`);
        }
        catch (error) {
            this.logger.error(`Failed to send contact email: ${error.message}`);
            throw new common_1.ServiceUnavailableException('Unable to send contact email');
        }
    }
    escapeHtml(value) {
        return value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
    renderHtml(dto) {
        const message = this.escapeHtml(dto.message).replace(/\n/g, '<br />');
        return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Contact Sublynk</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1a1a1a; }
    h1 { font-size: 20px; margin-bottom: 16px; }
    p { margin: 8px 0; }
    .meta { margin-bottom: 16px; }
    .meta strong { display: inline-block; width: 90px; }
    .message { background: #f9fafb; border: 1px solid #e5e7eb; padding: 16px; border-radius: 8px; }
  </style>
</head>
<body>
  <h1>Nouveau message de contact</h1>
  <div class="meta">
    <p><strong>Nom :</strong> ${this.escapeHtml(dto.name)}</p>
    <p><strong>Email :</strong> ${this.escapeHtml(dto.email)}</p>
    <p><strong>Sujet :</strong> ${this.escapeHtml(dto.subject)}</p>
  </div>
  <div class="message">
    ${message}
  </div>
</body>
</html>
    `.trim();
    }
    renderText(dto) {
        return [
            'Nouveau message de contact',
            `Nom: ${dto.name}`,
            `Email: ${dto.email}`,
            `Sujet: ${dto.subject}`,
            '',
            dto.message,
        ].join('\n');
    }
};
exports.ContactService = ContactService;
exports.ContactService = ContactService = ContactService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ContactService);
//# sourceMappingURL=contact.service.js.map