import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole, TicketStatus, TicketPriority } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TicketsService } from './tickets.service';
import {
  createTicketSchema,
  updateTicketSchema,
  createMessageSchema,
  type CreateTicketDto,
  type UpdateTicketDto,
  type CreateMessageDto,
} from './tickets.schema';

interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  organizationId: string | null;
}

@Controller('tickets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  // ========== Admin Endpoints ==========

  @Get('admin')
  @Roles(UserRole.SUPERADMIN, UserRole.SUPPORT)
  async findAllAdmin(
    @Query('status') status?: TicketStatus,
    @Query('priority') priority?: TicketPriority,
    @Query('assignedToId') assignedToId?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.ticketsService.findAll({
      status,
      priority,
      assignedToId,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  @Get('admin/stats')
  @Roles(UserRole.SUPERADMIN, UserRole.SUPPORT)
  async getStats() {
    return this.ticketsService.getStats();
  }

  @Get('admin/:id')
  @Roles(UserRole.SUPERADMIN, UserRole.SUPPORT)
  async findOneAdmin(@Param('id') id: string) {
    return this.ticketsService.findOne(id, { includeInternal: true });
  }

  @Patch('admin/:id')
  @Roles(UserRole.SUPERADMIN, UserRole.SUPPORT)
  async updateTicket(
    @Param('id') id: string,
    @Body() body: UpdateTicketDto,
  ) {
    const dto = updateTicketSchema.parse(body);
    return this.ticketsService.update(id, dto);
  }

  @Post('admin/:id/messages')
  @Roles(UserRole.SUPERADMIN, UserRole.SUPPORT)
  async addAdminMessage(
    @Param('id') id: string,
    @Body() body: CreateMessageDto,
    @CurrentUser() user: AuthUser,
  ) {
    const dto = createMessageSchema.parse(body);
    return this.ticketsService.addMessage(id, user.id, dto);
  }

  // ========== Creator Endpoints ==========

  @Get()
  @Roles(UserRole.ORG_ADMIN, UserRole.VIEWER)
  async findMyTickets(
    @CurrentUser() user: AuthUser,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    if (!user.organizationId) {
      return { tickets: [], total: 0 };
    }
    return this.ticketsService.findByOrganization(user.organizationId, {
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  @Post()
  @Roles(UserRole.ORG_ADMIN)
  async createTicket(
    @Body() body: CreateTicketDto,
    @CurrentUser() user: AuthUser,
  ) {
    if (!user.organizationId) {
      throw new Error('User must belong to an organization');
    }
    const dto = createTicketSchema.parse(body);
    return this.ticketsService.create(user.organizationId, user.id, dto);
  }

  @Get(':id')
  @Roles(UserRole.ORG_ADMIN, UserRole.VIEWER)
  async findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const ticket = await this.ticketsService.findOne(id, { includeInternal: false });

    // Verify the ticket belongs to the user's organization
    if (user.organizationId && ticket.organizationId !== user.organizationId) {
      throw new Error('You cannot access this ticket');
    }

    return ticket;
  }

  @Post(':id/messages')
  @Roles(UserRole.ORG_ADMIN)
  async addMessage(
    @Param('id') id: string,
    @Body() body: CreateMessageDto,
    @CurrentUser() user: AuthUser,
  ) {
    if (!user.organizationId) {
      throw new Error('User must belong to an organization');
    }
    const dto = createMessageSchema.parse(body);
    // Force isInternal to false for creators
    dto.isInternal = false;
    return this.ticketsService.addMessage(id, user.id, dto, {
      checkOrganization: user.organizationId,
    });
  }
}
