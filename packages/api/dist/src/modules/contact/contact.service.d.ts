import { ConfigService } from '@nestjs/config';
import type { ContactDto } from './contact.schema';
export declare class ContactService {
    private readonly config;
    private readonly logger;
    private readonly brevoApi;
    private readonly brevoEnabled;
    private readonly fromEmail;
    private readonly fromName;
    private readonly toEmail;
    constructor(config: ConfigService);
    sendContactMessage(dto: ContactDto): Promise<void>;
    private escapeHtml;
    private renderHtml;
    private renderText;
}
