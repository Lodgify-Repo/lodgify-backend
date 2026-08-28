import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Controller, Post, Get, Body, UseGuards, Param, Query, Request } from '@nestjs/common';
import { FoodOrdersService } from '../services/food-orders.service';
import { CreateFoodOrderDto } from '../dto/food.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Food - Orders')
@ApiBearerAuth('access-token')
@Controller('branches/:branchId/food/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FoodOrdersController {
  constructor(private readonly ordersService: FoodOrdersService) {}

  @Roles(Role.TRAVELER, Role.FRONT_DESK, Role.RESTAURANT_STAFF)
  @Post()
  @ApiOperation({ summary: 'F-F04: Place food order (with room link, scheduling, payment)' })
  async createOrder(@Request() req: any, @Param('branchId') branchId: string, @Body() dto: CreateFoodOrderDto) {
    return this.ordersService.createOrder(branchId, req.user.id, dto);
  }

  @Roles(Role.BRANCH_MANAGER, Role.RESTAURANT_STAFF, Role.FOOD_SERVICE_MANAGER)
  @Get()
  @ApiOperation({ summary: 'F-F04: List orders for branch' })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'RECEIVED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'] })
  async getOrders(@Param('branchId') branchId: string, @Query('status') status?: string) {
    return this.ordersService.getOrders(branchId, status);
  }

  @Roles(Role.TRAVELER, Role.BRANCH_MANAGER, Role.RESTAURANT_STAFF, Role.FOOD_SERVICE_MANAGER)
  @Get(':id')
  @ApiOperation({ summary: 'F-F04: Get order details' })
  async getOrderById(@Param('id') id: string) {
    return this.ordersService.getOrderById(id);
  }
}
