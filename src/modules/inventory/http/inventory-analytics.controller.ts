import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Controller, Get, UseGuards, Param, Query } from '@nestjs/common';
import { InventoryAnalyticsService } from '../services/inventory-analytics.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Inventory Analytics')
@ApiBearerAuth('access-token')
@Controller('branches/:branchId/inventory/analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryAnalyticsController {
  constructor(private readonly analyticsService: InventoryAnalyticsService) {}

  @Roles(Role.HOTEL_OWNER, Role.BRANCH_MANAGER)
  @Get()
  @ApiOperation({ summary: 'F-I11: Inventory Analytics (Consumption, Velocity)' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async getAnalytics(
    @Param('branchId') branchId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.analyticsService.getAnalytics(branchId, start, end);
  }
}
