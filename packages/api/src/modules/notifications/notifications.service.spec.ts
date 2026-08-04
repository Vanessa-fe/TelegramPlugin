import { ConfigService } from '@nestjs/config';
import * as Brevo from '@getbrevo/brevo';
import { NotificationsService } from './notifications.service';

describe('NotificationsService Brevo contact sync', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('upserts a verified user into the configured marketing list', async () => {
    const createContact = jest
      .spyOn(Brevo.ContactsApi.prototype, 'createContact')
      .mockResolvedValue({} as never);
    const config = {
      get: jest.fn((key: string) => {
        const values: Record<string, string> = {
          BREVO_API_KEY: 'test-api-key',
          BREVO_MARKETING_LIST_ID: '2',
          BREVO_FROM_EMAIL: 'hello@sublynk.test',
          BREVO_FROM_NAME: 'Sublynk',
        };
        return values[key];
      }),
    } as unknown as ConfigService;
    const service = new NotificationsService(config, {} as never);
    service.onModuleInit();

    await service.syncBrevoContact({
      userId: 'user-1',
      email: ' Creator@Example.com ',
      firstName: 'New',
      lastName: 'Creator',
    });

    expect(createContact).toHaveBeenCalledTimes(1);
    expect(createContact).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'creator@example.com',
        extId: 'user-1',
        attributes: {
          FIRSTNAME: 'New',
          LASTNAME: 'Creator',
        },
        listIds: [2],
        updateEnabled: true,
      }),
    );
  });
});
