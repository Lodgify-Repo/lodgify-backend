import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Controller, Get, Patch, Body, UseGuards, Param, Request } from '@nestjs/common';
import { KitchenService } from '../services/kitchen.service';
import { UpdateOrderStatusDto } from '../dto/food-extended.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Food - Kitchen')
@ApiBearerAuth('access-token')
@Controller('branches/:branchId/food/kitchen')
@UseGuards(JwtAuthGuard, RolesGuard)
export class KitchenController {
  constructor(private readonly kitchenService: KitchenService) {}

  @Roles(Role.BRANCH_MANAGER, Role.RESTAURANT_STAFF, Role.FOOD_SERVICE_MANAGER)
  @Get()
  @ApiOperation({ summary: 'F-F05: Kitchen display — active orders grouped by room' })
  async getKitchenDisplay(@Param('branchId') branchId: string) {
    return this.kitchenService.getKitchenDisplay(branchId);
  }

  @Roles(Role.BRANCH_MANAGER, Role.RESTAURANT_STAFF, Role.FOOD_SERVICE_MANAGER)
  @Patch('orders/:id/status')
  @ApiOperation({ summary: 'F-F06: Update order status (kitchen workflow)' })
  async updateOrderStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.kitchenService.updateOrderStatus(id, dto);
  }

  @Roles(Role.TRAVELER)
  @Get('orders/:id/track')
  @ApiOperation({ summary: 'F-F06: Guest order tracking' })
  async trackOrder(@Request() req: any, @Param('id') id: string) {
    return this.kitchenService.trackOrder(id, req.user.id);
  }
}
