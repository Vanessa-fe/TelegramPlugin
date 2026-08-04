import { Controller, Get, Param, Query } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminDashboardService } from './admin-dashboard.service';

@Controller('admin/dashboard')
export class AdminDashboardController {
  constructor(private readonly adminDashboardService: AdminDashboardService) {}

  @Get('stats')
  @Roles(UserRole.SUPERADMIN)
  async getStats() {
    return this.adminDashboardService.getDashboardStats();
  }

  @Get('unpaid')
  @Roles(UserRole.SUPERADMIN)
  async getUnpaidPayments(@Query('days') days?: string) {
    const daysNum = days ? parseInt(days, 10) : 30;
    return this.adminDashboardService.getFailedPaymentsList(daysNum);
  }

  @Get('commissions')
  @Roles(UserRole.SUPERADMIN)
  async getCommissions(@Query('days') days?: string) {
    const daysNum = days ? parseInt(days, 10) : 30;
    return this.adminDashboardService.getCommissionSummary(daysNum);
  }

  @Get('creators')
  @Roles(UserRole.SUPERADMIN)
  async getCreators() {
    return this.adminDashboardService.getCreatorsList();
  }

  @Get('creators/:id')
  @Roles(UserRole.SUPERADMIN)
  async getCreatorDetail(@Param('id') id: string) {
    return this.adminDashboardService.getCreatorDetail(id);
  }

  @Get('search')
  @Roles(UserRole.SUPERADMIN)
  async search(@Query('q') query: string) {
    if (!query || query.trim().length < 2) {
      return { organizations: [], users: [] };
    }
    return this.adminDashboardService.search(query.trim());
  }
}
