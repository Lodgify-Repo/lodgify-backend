import { Controller, Post, Get, Body, UseGuards, Param } from '@nestjs/common';
import { FoodService } from '../services/food.service';
import { CreateMenuItemDto, CreateFoodOrderDto } from '../dto/food.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('branches/:branchId/food')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FoodController {
  constructor(private readonly foodService: FoodService) {}

  @Roles(Role.HOTEL_OWNER, Role.HOTEL_MANAGER, Role.RESTAURANT_STAFF)
  @Post('menu')
  async createMenuItem(@Body() createDto: CreateMenuItemDto) {
    return this.foodService.createMenuItem(createDto);
  }

  @Roles(Role.GUEST, Role.FRONT_DESK, Role.RESTAURANT_STAFF)
  @Get('categories/:categoryId/menu')
  async getMenu(@Param('categoryId') categoryId: string) {
    return this.foodService.getMenuItemsByCategory(categoryId);
  }

  @Roles(Role.GUEST, Role.FRONT_DESK, Role.RESTAURANT_STAFF)
  @Post('orders')
  async createOrder(@Param('branchId') branchId: string, @Body() createDto: CreateFoodOrderDto) {
    return this.foodService.createOrder(branchId, createDto);
  }

  @Roles(Role.HOTEL_MANAGER, Role.RESTAURANT_STAFF)
  @Get('orders')
  async getOrders(@Param('branchId') branchId: string) {
    return this.foodService.getOrders(branchId);
  }
}
