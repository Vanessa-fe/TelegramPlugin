import { type ContactDto } from './contact.schema';
import { ContactService } from './contact.service';
export declare class ContactController {
    private readonly contactService;
    constructor(contactService: ContactService);
    submitContact(body: ContactDto): Promise<{
        success: true;
    }>;
}
