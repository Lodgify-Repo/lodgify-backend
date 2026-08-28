import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Controller, Get, Post, Body, UseGuards, Param, Query, Request } from '@nestjs/common';
import { OrderHistoryService } from '../services/order-history.service';
import { ReorderDto } from '../dto/food-extended.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Food - Order History')
@ApiBearerAuth('access-token')
@Controller('food/order-history')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrderHistoryController {
  constructor(private readonly orderHistoryService: OrderHistoryService) {}

  @Roles(Role.TRAVELER)
  @Get()
  @ApiOperation({ summary: 'F-F11: Get guest order history' })
  @ApiQuery({ name: 'branchId', required: false })
  async getHistory(@Request() req: any, @Query('branchId') branchId?: string) {
    return this.orderHistoryService.getGuestOrderHistory(req.user.id, branchId);
  }

  @Roles(Role.TRAVELER)
  @Post('reorder')
  @ApiOperation({ summary: 'F-F11: Reorder from past order (with optional quantity changes)' })
  async reorder(@Request() req: any, @Body() dto: ReorderDto) {
    return this.orderHistoryService.reorder(req.user.id, dto);
  }
}
