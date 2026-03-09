import { Controller, Get, Query } from '@nestjs/common';
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

  @Get('creators')
  @Roles(UserRole.SUPERADMIN)
  async getCreators() {
    return this.adminDashboardService.getCreatorsList();
  }
}
