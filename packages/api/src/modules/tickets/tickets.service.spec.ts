import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { TicketsService } from './tickets.service';

describe('TicketsService notifications', () => {
  let service: TicketsService;
  let prisma: any;
  let notifications: jest.Mocked<NotificationsService>;

  const ticket = {
    id: '904e1e58-0000-4000-8000-000000000000',
    organizationId: 'org-1',
    subject: 'Clients sans lien',
    status: 'OPEN',
    priority: 'URGENT',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketsService,
        {
          provide: PrismaService,
          useValue: {
            ticket: {
              create: jest.fn().mockResolvedValue(ticket),
              findUnique: jest.fn().mockResolvedValue(ticket),
              update: jest.fn(),
            },
            ticketMessage: {
              create: jest.fn(),
              findFirst: jest.fn().mockResolvedValue({
                author: { email: 'creator@example.com' },
              }),
            },
            organization: {
              findUnique: jest.fn().mockResolvedValue({ name: 'cote andcash' }),
            },
            user: {
              findUnique: jest
                .fn()
                .mockResolvedValue({ email: 'creator@example.com' }),
            },
          },
        },
        {
          provide: NotificationsService,
          useValue: {
            sendAdminTicketNotification: jest.fn(),
            sendTicketReplyNotification: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(TicketsService);
    prisma = module.get(PrismaService);
    notifications = module.get(NotificationsService);
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should email the admin when a creator opens a ticket', async () => {
    await service.create('org-1', 'user-1', {
      subject: ticket.subject,
      priority: 'URGENT',
      message: 'Mes clients ne reçoivent pas le lien',
    } as any);

    expect(notifications.sendAdminTicketNotification).toHaveBeenCalledWith({
      ticketId: ticket.id,
      subject: ticket.subject,
      priority: 'URGENT',
      organizationName: 'cote andcash',
      authorEmail: 'creator@example.com',
      message: 'Mes clients ne reçoivent pas le lien',
      isNewTicket: true,
    });
  });

  it('should still create the ticket when the notification fails', async () => {
    notifications.sendAdminTicketNotification.mockRejectedValue(
      new Error('Brevo down'),
    );

    await expect(
      service.create('org-1', 'user-1', {
        subject: ticket.subject,
        priority: 'URGENT',
        message: 'Bonjour',
      } as any),
    ).resolves.toEqual(ticket);
  });

  it('should email the admin when the creator replies', async () => {
    prisma.ticketMessage.create.mockResolvedValue({ isInternal: false });

    await service.addMessage(
      ticket.id,
      'user-1',
      { content: 'Toujours bloqué' } as any,
      { checkOrganization: 'org-1' },
    );

    expect(notifications.sendAdminTicketNotification).toHaveBeenCalledWith(
      expect.objectContaining({ isNewTicket: false, message: 'Toujours bloqué' }),
    );
    expect(notifications.sendTicketReplyNotification).not.toHaveBeenCalled();
  });

  it('should email the creator when support replies publicly', async () => {
    prisma.ticketMessage.create.mockResolvedValue({ isInternal: false });

    await service.addMessage(ticket.id, 'admin-1', {
      content: 'Corrigé, merci !',
    } as any);

    expect(notifications.sendTicketReplyNotification).toHaveBeenCalledWith({
      to: 'creator@example.com',
      ticketId: ticket.id,
      subject: ticket.subject,
      message: 'Corrigé, merci !',
    });
    expect(notifications.sendAdminTicketNotification).not.toHaveBeenCalled();
  });

  it('should not email anyone for internal notes', async () => {
    prisma.ticketMessage.create.mockResolvedValue({ isInternal: true });

    await service.addMessage(ticket.id, 'admin-1', {
      content: 'Note interne',
      isInternal: true,
    } as any);

    expect(notifications.sendTicketReplyNotification).not.toHaveBeenCalled();
    expect(notifications.sendAdminTicketNotification).not.toHaveBeenCalled();
  });
});
