import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { DashboardService } from '../services/dashboard.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Dashboard')
@ApiBearerAuth('access-token')
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Roles(Role.SUPER_ADMIN)
  @Get('admin/stats')
  @ApiOperation({ summary: 'Get admin stats' })
  async getAdminStats() {
    return this.dashboardService.getAdminStats();
  }

  @Roles(Role.HOTEL_OWNER, Role.HOTEL_MANAGER)
  @Get('hotel/stats')
  @ApiOperation({ summary: 'Get hotel stats' })
  async getHotelStats(@Request() req: any) {
    return this.dashboardService.getHotelStats(req.user.id);
  }
}
