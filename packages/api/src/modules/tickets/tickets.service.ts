import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  Ticket,
  TicketMessage,
  TicketStatus,
  TicketPriority,
} from '@prisma/client';
import type {
  CreateTicketDto,
  UpdateTicketDto,
  CreateMessageDto,
} from './tickets.schema';

export interface TicketWithMessages extends Ticket {
  messages: (TicketMessage & {
    author: {
      id: string;
      email: string;
      name: string | null;
      role: string;
    };
  })[];
  organization: { id: string; name: string; billingEmail: string };
  assignedTo: {
    id: string;
    email: string;
    name: string | null;
  } | null;
  _count: { messages: number };
}

export interface TicketListItem {
  id: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  organization: { id: string; name: string };
  assignedTo: { id: string; email: string; name: string | null } | null;
  _count: { messages: number };
  createdAt: Date;
  updatedAt: Date;
  closedAt: Date | null;
}

@Injectable()
export class TicketsService {
  constructor(private readonly prisma: PrismaService) {}

  private buildDisplayName(user: {
    firstName?: string | null;
    lastName?: string | null;
  }): string | null {
    const parts = [user.firstName?.trim(), user.lastName?.trim()].filter(
      (value): value is string => Boolean(value),
    );

    return parts.length > 0 ? parts.join(' ') : null;
  }

  /**
   * Create a new ticket (called by creator)
   */
  async create(
    organizationId: string,
    authorId: string,
    dto: CreateTicketDto,
  ): Promise<Ticket> {
    const ticket = await this.prisma.ticket.create({
      data: {
        organizationId,
        subject: dto.subject,
        priority: dto.priority,
        messages: {
          create: {
            authorId,
            content: dto.message,
            isInternal: false,
          },
        },
      },
    });

    return ticket;
  }

  /**
   * Get all tickets (admin view)
   */
  async findAll(options?: {
    status?: TicketStatus;
    priority?: TicketPriority;
    assignedToId?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ tickets: TicketListItem[]; total: number }> {
    const where: Record<string, unknown> = {};

    if (options?.status) where.status = options.status;
    if (options?.priority) where.priority = options.priority;
    if (options?.assignedToId) where.assignedToId = options.assignedToId;

    const [tickets, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        include: {
          organization: { select: { id: true, name: true } },
          assignedTo: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
          _count: { select: { messages: true } },
        },
        orderBy: [
          { status: 'asc' }, // OPEN first
          { priority: 'desc' }, // URGENT first
          { updatedAt: 'desc' },
        ],
        take: options?.limit ?? 50,
        skip: options?.offset ?? 0,
      }),
      this.prisma.ticket.count({ where }),
    ]);

    return {
      tickets: tickets.map((t) => ({
        id: t.id,
        subject: t.subject,
        status: t.status,
        priority: t.priority,
        organization: t.organization,
        assignedTo: t.assignedTo
          ? {
              id: t.assignedTo.id,
              email: t.assignedTo.email,
              name: this.buildDisplayName(t.assignedTo),
            }
          : null,
        _count: { messages: t._count.messages },
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        closedAt: t.closedAt,
      })),
      total,
    };
  }

  /**
   * Get tickets for a specific organization (creator view)
   */
  async findByOrganization(
    organizationId: string,
    options?: { limit?: number; offset?: number },
  ): Promise<{ tickets: TicketListItem[]; total: number }> {
    const where = { organizationId };

    const [tickets, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        include: {
          organization: { select: { id: true, name: true } },
          assignedTo: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
          _count: { select: { messages: true } },
        },
        orderBy: { updatedAt: 'desc' },
        take: options?.limit ?? 50,
        skip: options?.offset ?? 0,
      }),
      this.prisma.ticket.count({ where }),
    ]);

    return {
      tickets: tickets.map((t) => ({
        id: t.id,
        subject: t.subject,
        status: t.status,
        priority: t.priority,
        organization: t.organization,
        assignedTo: t.assignedTo
          ? {
              id: t.assignedTo.id,
              email: t.assignedTo.email,
              name: this.buildDisplayName(t.assignedTo),
            }
          : null,
        _count: { messages: t._count.messages },
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        closedAt: t.closedAt,
      })),
      total,
    };
  }

  /**
   * Get a single ticket with messages
   */
  async findOne(
    id: string,
    options?: { includeInternal?: boolean },
  ): Promise<TicketWithMessages> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: {
        organization: {
          select: { id: true, name: true, billingEmail: true },
        },
        assignedTo: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        messages: {
          where: options?.includeInternal ? undefined : { isInternal: false },
          include: {
            author: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        _count: { select: { messages: true } },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    return {
      ...ticket,
      assignedTo: ticket.assignedTo
        ? {
            id: ticket.assignedTo.id,
            email: ticket.assignedTo.email,
            name: this.buildDisplayName(ticket.assignedTo),
          }
        : null,
      messages: ticket.messages.map((message) => ({
        ...message,
        author: {
          id: message.author.id,
          email: message.author.email,
          name: this.buildDisplayName(message.author),
          role: message.author.role,
        },
      })),
    };
  }

  /**
   * Update ticket (admin only)
   */
  async update(id: string, dto: UpdateTicketDto): Promise<Ticket> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const data: Record<string, unknown> = {};

    if (dto.status !== undefined) {
      data.status = dto.status;
      if (dto.status === 'CLOSED' || dto.status === 'RESOLVED') {
        data.closedAt = new Date();
      } else {
        data.closedAt = null;
      }
    }

    if (dto.priority !== undefined) data.priority = dto.priority;
    if (dto.assignedToId !== undefined) data.assignedToId = dto.assignedToId;

    return this.prisma.ticket.update({
      where: { id },
      data,
    });
  }

  /**
   * Add a message to a ticket
   */
  async addMessage(
    ticketId: string,
    authorId: string,
    dto: CreateMessageDto,
    options?: { checkOrganization?: string },
  ): Promise<TicketMessage> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // If checkOrganization is provided, verify the ticket belongs to that org
    if (
      options?.checkOrganization &&
      ticket.organizationId !== options.checkOrganization
    ) {
      throw new ForbiddenException('You cannot access this ticket');
    }

    // If not admin, internal messages are not allowed
    if (options?.checkOrganization && dto.isInternal) {
      throw new ForbiddenException('Internal messages are not allowed');
    }

    const message = await this.prisma.ticketMessage.create({
      data: {
        ticketId,
        authorId,
        content: dto.content,
        isInternal: dto.isInternal ?? false,
      },
    });

    // Update ticket status if it was closed and a new message is added
    if (ticket.status === 'CLOSED' || ticket.status === 'RESOLVED') {
      await this.prisma.ticket.update({
        where: { id: ticketId },
        data: { status: 'OPEN', closedAt: null },
      });
    }

    return message;
  }

  /**
   * Get ticket stats for admin dashboard
   */
  async getStats(): Promise<{
    open: number;
    inProgress: number;
    resolved: number;
    closed: number;
    urgent: number;
  }> {
    const [open, inProgress, resolved, closed, urgent] = await Promise.all([
      this.prisma.ticket.count({ where: { status: 'OPEN' } }),
      this.prisma.ticket.count({ where: { status: 'IN_PROGRESS' } }),
      this.prisma.ticket.count({ where: { status: 'RESOLVED' } }),
      this.prisma.ticket.count({ where: { status: 'CLOSED' } }),
      this.prisma.ticket.count({
        where: {
          priority: 'URGENT',
          status: { notIn: ['CLOSED', 'RESOLVED'] },
        },
      }),
    ]);

    return { open, inProgress, resolved, closed, urgent };
  }
}
