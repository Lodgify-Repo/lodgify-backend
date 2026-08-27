import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Controller, Get, Body, UseGuards, Param, Patch } from '@nestjs/common';
import { LowStockAlertsService } from '../services/low-stock-alerts.service';
import { UpdateAlertConfigDto } from '../dto/inventory-extended.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Inventory Alerts')
@ApiBearerAuth('access-token')
@Controller('branches/:branchId/inventory/alerts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LowStockAlertsController {
  constructor(private readonly alertsService: LowStockAlertsService) {}

  @Roles(Role.HOTEL_OWNER, Role.BRANCH_MANAGER)
  @Get('config')
  @ApiOperation({ summary: 'F-I06: Get alert configuration' })
  async getConfig(@Param('branchId') branchId: string) {
    return this.alertsService.getConfig(branchId);
  }

  @Roles(Role.HOTEL_OWNER, Role.BRANCH_MANAGER)
  @Patch('config')
  @ApiOperation({ summary: 'F-I06: Update alert configuration' })
  async updateConfig(@Param('branchId') branchId: string, @Body() dto: UpdateAlertConfigDto) {
    return this.alertsService.updateConfig(branchId, dto);
  }

  @Roles(Role.HOTEL_OWNER, Role.BRANCH_MANAGER)
  @Get('low-stock')
  @ApiOperation({ summary: 'F-I06: Get low stock items' })
  async getLowStockItems(@Param('branchId') branchId: string) {
    return this.alertsService.getLowStockItems(branchId);
  }
}
